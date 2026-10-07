"use client";

import { useState, useTransition } from "react";
import {
  addIngredient,
  deleteIngredient,
  updateIngredient,
} from "@/app/actions/meals";
import { defaultRole } from "@/lib/pantry-dictionary";

export type IngRow = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  role: string;
};

export function IngredientEditor({
  mealId,
  variantId,
  ingredients,
  title,
}: {
  mealId: string;
  variantId?: string | null;
  ingredients: IngRow[];
  title: string;
}) {
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"G" | "ML" | "PIECE" | "BUNCH" | "">("G");
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <h2 className="section-label">{title}</h2>
      <div className="space-y-2">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] py-2"
          >
            <input
              className="field flat min-w-[140px] flex-1"
              aria-label={`${ing.name} name`}
              defaultValue={ing.name}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== ing.name) {
                  start(() => updateIngredient(ing.id, { name: value }));
                }
              }}
            />
            <input
              className="field flat w-[88px]"
              inputMode="decimal"
              aria-label={`${ing.name} amount`}
              defaultValue={ing.quantity ?? ""}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                const q = raw === "" ? null : Number(raw);
                start(() =>
                  updateIngredient(ing.id, {
                    quantity: Number.isFinite(q as number) ? q : null,
                  }),
                );
              }}
            />
            <select
              className="field flat fit"
              aria-label={`${ing.name} unit`}
              defaultValue={ing.unit ?? ""}
              onChange={(e) =>
                start(() =>
                  updateIngredient(ing.id, {
                    unit: (e.target.value || null) as
                      | "G"
                      | "ML"
                      | "PIECE"
                      | "BUNCH"
                      | null,
                  }),
                )
              }
            >
              <option value="">—</option>
              <option value="G">g</option>
              <option value="ML">ml</option>
              <option value="PIECE">piece</option>
              <option value="BUNCH">bunch</option>
            </select>
            <div className="grid h-11 grid-cols-2 overflow-hidden rounded-full border border-[var(--line)]">
              {(["BUY", "PANTRY"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`px-3 text-sm font-semibold ${
                    ing.role === role ? "seg-active" : "seg-idle"
                  }`}
                  onClick={() =>
                    start(() => updateIngredient(ing.id, { role }))
                  }
                >
                  {role === "BUY" ? "Buy" : "Cupboard"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-text muted"
              onClick={() => start(() => deleteIngredient(ing.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[160px] flex-1">
          <span className="section-label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </label>
        <label>
          <span className="section-label">Amount</span>
          <input
            value={quantity}
            inputMode="decimal"
            onChange={(e) => setQuantity(e.target.value)}
            className="field w-[88px]"
          />
        </label>
        <label>
          <span className="section-label">Unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="field fit"
          >
            <option value="G">g</option>
            <option value="ML">ml</option>
            <option value="PIECE">piece</option>
            <option value="BUNCH">bunch</option>
            <option value="">—</option>
          </select>
        </label>
        <button
          type="button"
          className="btn-outline"
          disabled={pending || !name.trim()}
          onClick={() => {
            const trimmed = name.trim();
            if (!trimmed) {
              setError("Give the ingredient a name.");
              return;
            }
            const amount =
              quantity.trim() === "" ? null : Number(quantity.replace(",", "."));
            if (amount != null && !Number.isFinite(amount)) {
              setError("Amount needs to be a number, or left empty.");
              return;
            }
            setError(null);
            const role = defaultRole(trimmed);
            start(async () => {
              await addIngredient({
                mealId,
                name: trimmed,
                quantity: amount,
                unit: unit || null,
                role,
                variantId: variantId ?? null,
              });
              setName("");
              setQuantity("");
            });
          }}
        >
          Add ingredient
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--warning)]">
          {error}
        </p>
      ) : null}
      {name && defaultRole(name) === "PANTRY" ? (
        <p className="text-sm text-[var(--muted)]">
          Cupboard item. Switch it if you need to buy it.
        </p>
      ) : null}
    </section>
  );
}
