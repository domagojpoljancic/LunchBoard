"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adjustInventoryQuantity,
  deleteInventoryItem,
  upsertInventoryItem,
} from "@/app/actions/inventory";
import {
  decrementPreparedPortion,
  deletePreparedDish,
  undoArchivePreparedDish,
  upsertPreparedDish,
} from "@/app/actions/prepared";
import { formatAmount } from "@/lib/protein";

type InventoryRow = {
  id: string;
  name: string;
  location: string;
  quantity: number | null;
  unit: string;
  warnBelow: number | null;
};

type PreparedRow = {
  id: string;
  name: string;
  location: string;
  portionsRemaining: number;
  linkedMealId: string | null;
  linkedMealName: string | null;
  archivedAt: string | null;
};

const LOCATIONS = ["PANTRY", "FREEZER", "FRIDGE"] as const;
const LOCATION_LABEL: Record<string, string> = {
  PANTRY: "Pantry",
  FREEZER: "Freezer",
  FRIDGE: "Fridge",
};

export function AtHome({
  inventory,
  prepared,
  meals,
}: {
  inventory: InventoryRow[];
  prepared: PreparedRow[];
  meals: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"inventory" | "prepared">("inventory");
  const [busy, start] = useTransition();
  const [invForm, setInvForm] = useState({
    name: "",
    location: "PANTRY" as (typeof LOCATIONS)[number],
    quantity: "",
    unit: "G",
  });
  const [prepForm, setPrepForm] = useState({
    name: "",
    portions: "4",
    location: "FREEZER" as (typeof LOCATIONS)[number],
    linkedMealId: "",
  });

  const byLocation = LOCATIONS.map((loc) => ({
    loc,
    items: inventory.filter((i) => i.location === loc),
  }));

  const activePrepared = prepared.filter((p) => !p.archivedAt);
  const archivedPrepared = prepared.filter((p) => p.archivedAt);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl">At home</h1>
        <p className="text-[var(--muted)]">
          Stock you keep across weeks, and dishes already cooked and ready to heat.
        </p>
      </header>

      <div className="flex gap-2 border-b border-[var(--line)] pb-2">
        <button
          type="button"
          className={tab === "inventory" ? "btn-primary" : "btn-text"}
          onClick={() => setTab("inventory")}
        >
          Inventory
        </button>
        <button
          type="button"
          className={tab === "prepared" ? "btn-primary" : "btn-text"}
          onClick={() => setTab("prepared")}
        >
          Prepared
        </button>
      </div>

      {tab === "inventory" ? (
        <section className="space-y-6">
          <form
            className="sheet space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                await upsertInventoryItem({
                  name: invForm.name,
                  location: invForm.location,
                  quantity: invForm.quantity
                    ? Number(invForm.quantity)
                    : null,
                  unit: invForm.quantity ? (invForm.unit as "G") : "",
                });
                setInvForm({
                  name: "",
                  location: "PANTRY",
                  quantity: "",
                  unit: "G",
                });
                router.refresh();
              });
            }}
          >
            <h2 className="font-display text-xl">Add staple</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <input
                className="field md:col-span-2"
                placeholder="Pasta"
                value={invForm.name}
                onChange={(e) =>
                  setInvForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <select
                className="field"
                value={invForm.location}
                onChange={(e) =>
                  setInvForm((f) => ({
                    ...f,
                    location: e.target.value as (typeof LOCATIONS)[number],
                  }))
                }
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {LOCATION_LABEL[l]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="field w-full"
                  placeholder="800"
                  inputMode="decimal"
                  value={invForm.quantity}
                  onChange={(e) =>
                    setInvForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
                <select
                  className="field"
                  value={invForm.unit}
                  onChange={(e) =>
                    setInvForm((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  <option value="G">g</option>
                  <option value="ML">ml</option>
                  <option value="PIECE">pc</option>
                  <option value="BUNCH">bunch</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              Save
            </button>
          </form>

          {inventory.length === 0 ? (
            <p className="text-[var(--muted)]">
              Nothing logged yet. Add pasta, rice, or freezer protein when you have it.
            </p>
          ) : (
            byLocation.map(({ loc, items }) =>
              items.length === 0 ? null : (
                <div key={loc} className="space-y-2">
                  <h3 className="section-label">{LOCATION_LABEL[loc]}</h3>
                  <ul className="sheet divide-y divide-[var(--line)]">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-lg">{item.name}</p>
                          <p className="text-sm text-[var(--muted)]">
                            {formatAmount(item.quantity, item.unit || null) ||
                              "Some"}
                            {item.warnBelow != null &&
                            item.quantity != null &&
                            item.quantity <= item.warnBelow
                              ? " · running low"
                              : ""}
                          </p>
                        </div>
                        <input
                          className="field w-24"
                          defaultValue={item.quantity ?? ""}
                          inputMode="decimal"
                          aria-label={`Quantity for ${item.name}`}
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            const next = raw === "" ? null : Number(raw);
                            if (next === item.quantity) return;
                            start(async () => {
                              await adjustInventoryQuantity(item.id, next);
                              router.refresh();
                            });
                          }}
                        />
                        <button
                          type="button"
                          className="btn-text text-[var(--warning)]"
                          onClick={() =>
                            start(async () => {
                              await deleteInventoryItem(item.id);
                              router.refresh();
                            })
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <form
            className="sheet space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                await upsertPreparedDish({
                  name: prepForm.name,
                  portionsRemaining: Number(prepForm.portions) || 0,
                  location: prepForm.location,
                  linkedMealId: prepForm.linkedMealId || null,
                });
                setPrepForm({
                  name: "",
                  portions: "4",
                  location: "FREEZER",
                  linkedMealId: "",
                });
                router.refresh();
              });
            }}
          >
            <h2 className="font-display text-xl">Add prepared dish</h2>
            <p className="text-sm text-[var(--muted)]">
              Name it however you like. No categories.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="field"
                placeholder="Your name for it"
                value={prepForm.name}
                onChange={(e) =>
                  setPrepForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <input
                className="field"
                type="number"
                min={0}
                max={99}
                value={prepForm.portions}
                onChange={(e) =>
                  setPrepForm((f) => ({ ...f, portions: e.target.value }))
                }
                aria-label="Portions remaining"
              />
              <select
                className="field"
                value={prepForm.location}
                onChange={(e) =>
                  setPrepForm((f) => ({
                    ...f,
                    location: e.target.value as (typeof LOCATIONS)[number],
                  }))
                }
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {LOCATION_LABEL[l]}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={prepForm.linkedMealId}
                onChange={(e) =>
                  setPrepForm((f) => ({ ...f, linkedMealId: e.target.value }))
                }
              >
                <option value="">No linked meal</option>
                {meals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              Save
            </button>
          </form>

          {activePrepared.length === 0 ? (
            <p className="text-[var(--muted)]">
              No ready dishes yet. Log a batch after you cook.
            </p>
          ) : (
            <ul className="sheet divide-y divide-[var(--line)]">
              {activePrepared.map((dish) => (
                <li
                  key={dish.id}
                  className="flex flex-wrap items-center gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-lg">{dish.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {dish.portionsRemaining} portions ·{" "}
                      {LOCATION_LABEL[dish.location] ?? dish.location}
                      {dish.linkedMealName
                        ? ` · linked to ${dish.linkedMealName}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-outline min-h-11"
                    onClick={() =>
                      start(async () => {
                        await decrementPreparedPortion(dish.id, 1);
                        router.refresh();
                      })
                    }
                  >
                    Ate one
                  </button>
                  <button
                    type="button"
                    className="btn-text text-[var(--warning)]"
                    onClick={() =>
                      start(async () => {
                        await deletePreparedDish(dish.id);
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {archivedPrepared.length > 0 ? (
            <div className="space-y-2">
              <h3 className="section-label">Finished</h3>
              <ul className="space-y-2">
                {archivedPrepared.map((dish) => (
                  <li
                    key={dish.id}
                    className="flex items-center justify-between gap-3 text-[var(--muted)]"
                  >
                    <span>{dish.name}</span>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() =>
                        start(async () => {
                          await undoArchivePreparedDish(dish.id).catch(
                            () => undefined,
                          );
                          router.refresh();
                        })
                      }
                    >
                      Undo archive
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
