"use client";

import { useState, useTransition } from "react";
import { createMeal } from "@/app/actions/meals";
import { defaultRole } from "@/lib/pantry-dictionary";
import { createMealSchema } from "@/lib/schemas";

const PROTEINS = [
  ["BEEF", "Beef"],
  ["WHITE_MEAT", "White meat"],
  ["FISH", "Fish"],
  ["VEGETARIAN", "Vegetarian"],
  ["VEGAN", "Vegan"],
  ["DAIRY", "Dairy"],
] as const;

function problemMessage(path: PropertyKey | undefined, fallback: string) {
  if (path === "name") return "Give the meal a name.";
  if (path === "ingredients") return "Add at least one ingredient.";
  if (path === "proteinGroup") return "Choose a protein.";
  if (path === "activeMinutes") return "Add the hands-on minutes.";
  if (path === "totalMinutes") return fallback;
  return "Check the fields and try again.";
}

function parseLines(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^(.*?)(?:\s+(\d+(?:\.\d+)?)\s*(g|ml|piece|pcs|bunch)?)?$/i,
      );
      const name = (match?.[1] || line).trim();
      const qty = match?.[2] ? Number(match[2]) : null;
      const unitRaw = (match?.[3] || "").toLowerCase();
      const unit =
        unitRaw === "g"
          ? "G"
          : unitRaw === "ml"
            ? "ML"
            : unitRaw === "bunch"
              ? "BUNCH"
              : unitRaw
                ? "PIECE"
                : null;
      return {
        name,
        quantity: qty,
        unit: unit as "G" | "ML" | "PIECE" | "BUNCH" | null,
        role: defaultRole(name),
      };
    })
    .filter((line) => line.name.length > 0);
}

export function NewMealForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="sheet space-y-4 p-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const activeRaw = String(form.get("activeMinutes") || "");
        const totalRaw = String(form.get("totalMinutes") || "");
        const parsed = createMealSchema.safeParse({
          name: String(form.get("name") || ""),
          proteinGroup: String(form.get("proteinGroup") || ""),
          activeMinutes: activeRaw === "" ? Number.NaN : Number(activeRaw),
          totalMinutes: totalRaw === "" ? Number.NaN : Number(totalRaw),
          ingredients: parseLines(String(form.get("ingredients") || "")),
        });
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          setError(
            problemMessage(
              issue?.path[0],
              issue?.message || "Add the total minutes.",
            ),
          );
          return;
        }
        setError(null);
        start(async () => {
          await createMeal(parsed.data);
        });
      }}
    >
      <label className="block">
        <span className="section-label">Name</span>
        <input
          name="name"
          required
          placeholder="Burrata pasta"
          className="field font-display text-xl"
        />
      </label>
      <label className="block">
        <span className="section-label">Ingredients</span>
        <textarea
          name="ingredients"
          required
          rows={6}
          placeholder={"pasta 300 g\nburrata 200 g\ncherry tomatoes 200 g\nbasil\nGrana Padano 40 g"}
          className="field"
        />
      </label>
      <label className="block">
        <span className="section-label">Protein</span>
        <select name="proteinGroup" required defaultValue="" className="field">
          <option value="" disabled>
            Choose a protein
          </option>
          {PROTEINS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
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
            className="field"
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--warning)]">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save meal"}
      </button>
    </form>
  );
}
