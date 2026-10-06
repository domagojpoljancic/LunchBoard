"use client";

import { useState, useTransition } from "react";
import { setConfidence, updateMealBasics } from "@/app/actions/meals";
import {
  confidenceActionLabel,
  methodLabel,
} from "@/lib/protein";

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
  const [confidence, setLocalConfidence] = useState(meal.confidence);

  return (
    <form
      className="sheet space-y-4 p-5"
      action={(formData) => {
        start(async () => {
          setSaved(false);
          await updateMealBasics(meal.id, {
            name: String(formData.get("name") || meal.name),
            method: String(formData.get("method") || meal.method),
            cuisine: String(formData.get("cuisine") || "") || null,
            activeMinutes: formData.get("activeMinutes")
              ? Number(formData.get("activeMinutes"))
              : null,
            totalMinutes: formData.get("totalMinutes")
              ? Number(formData.get("totalMinutes"))
              : null,
            completePlate: formData.get("completePlate") === "on",
          });
          setSaved(true);
        });
      }}
    >
      <label className="block">
        <span className="section-label">Meal name</span>
        <input
          name="name"
          defaultValue={meal.name}
          className="font-display mt-1 h-14 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-[32px]"
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
            defaultValue={meal.activeMinutes ?? ""}
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
          />
        </label>
        <label>
          <span className="section-label">Total minutes</span>
          <input
            name="totalMinutes"
            type="number"
            defaultValue={meal.totalMinutes ?? ""}
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
          />
        </label>
      </div>
      <label>
        <span className="section-label">Method</span>
        <select
          name="method"
          defaultValue={meal.method}
          className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
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
          className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
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
