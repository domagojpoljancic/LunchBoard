"use client";

import { useEffect, useState } from "react";
import { togglePantryItem, toggleShoppingItem } from "@/app/actions/list";
import { formatAmount } from "@/lib/protein";

function CheckRow({
  id,
  checked,
  label,
  amount,
  onToggle,
}: {
  id: string;
  checked: boolean;
  label: string;
  amount?: string;
  onToggle: (id: string, checked: boolean) => Promise<void>;
}) {
  const [on, setOn] = useState(checked);

  useEffect(() => {
    setOn(checked);
  }, [checked]);

  return (
    <li
      className={`flex min-h-14 items-center gap-3 border-b border-[var(--line)] ${
        on ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        className="h-[22px] w-[22px]"
        checked={on}
        onChange={(event) => {
          const next = event.target.checked;
          setOn(next);
          void onToggle(id, next).catch(() => setOn(!next));
        }}
      />
      <span className="flex-1 text-lg">{label}</span>
      {amount ? <span className="font-display text-lg">{amount}</span> : null}
    </li>
  );
}

export function BuyList({
  planItems,
  carriedItems,
  pantryItems,
}: {
  planItems: Array<{
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    checked: boolean;
  }>;
  carriedItems: Array<{
    id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    checked: boolean;
  }>;
  pantryItems: Array<{
    id: string;
    name: string;
    checked: boolean;
  }>;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-6">
      <section className="sheet p-5">
        <h1 className="font-display mb-4 text-3xl">To buy</h1>
        {planItems.length === 0 && carriedItems.length === 0 ? (
          <p className="text-[var(--muted)]">
            Nothing to buy yet. Place a lunch on the board.
          </p>
        ) : (
          <ul>
            {planItems.map((item) => (
              <CheckRow
                key={item.id}
                id={item.id}
                checked={item.checked}
                label={item.name}
                amount={formatAmount(item.quantity, item.unit)}
                onToggle={toggleShoppingItem}
              />
            ))}
          </ul>
        )}

        {carriedItems.length > 0 ? (
          <div className="mt-8">
            <h2 className="section-label mb-2">Still to buy</h2>
            <ul>
              {carriedItems.map((item) => (
                <CheckRow
                  key={item.id}
                  id={item.id}
                  checked={item.checked}
                  label={item.name}
                  amount={formatAmount(item.quantity, item.unit)}
                  onToggle={toggleShoppingItem}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="sheet p-5">
        <h2 className="font-display mb-2 text-2xl">Cupboard</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Check these before you shop. You will be asked again next week.
        </p>
        <ul>
          {pantryItems.map((item) => (
            <CheckRow
              key={item.id}
              id={item.id}
              checked={item.checked}
              label={item.name}
              onToggle={togglePantryItem}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
