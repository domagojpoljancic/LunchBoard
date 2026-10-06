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
              className="min-w-[140px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-2"
              defaultValue={ing.name}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== ing.name) {
                  start(() => updateIngredient(ing.id, { name: value }));
                }
              }}
            />
            <input
              className="w-[72px] rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-2"
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
              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-2"
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
            className="mt-1 h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2"
          />
        </label>
        <label>
          <span className="section-label">Amount</span>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 h-11 w-[72px] rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2"
          />
        </label>
        <label>
          <span className="section-label">Unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="mt-1 h-11 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2"
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
            const role = defaultRole(name);
            start(async () => {
              await addIngredient(mealId, {
                name,
                quantity: quantity.trim() === "" ? null : Number(quantity),
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
      {name && defaultRole(name) === "PANTRY" ? (
        <p className="text-sm text-[var(--muted)]">
          Cupboard item. Switch it if you need to buy it.
        </p>
      ) : null}
    </section>
  );
}
