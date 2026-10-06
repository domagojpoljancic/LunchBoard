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

function lineText(
  name: string,
  quantity: number | null,
  unit: string | null,
): string {
  const amount = formatAmount(quantity, unit);
  return amount ? `${name} — ${amount}` : name;
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
  const [copied, setCopied] = useState(false);

  function copyList() {
    const buy = [...planItems, ...carriedItems]
      .filter((i) => !i.checked)
      .map((i) => lineText(i.name, i.quantity, i.unit));
    const cupboard = pantryItems
      .filter((i) => !i.checked)
      .map((i) => i.name);
    const parts = [...buy];
    if (cupboard.length) {
      parts.push("", "Check the cupboard:", ...cupboard);
    }
    void navigator.clipboard.writeText(parts.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-6">
      <section className="sheet p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl">To buy</h1>
          <button type="button" className="btn-outline" onClick={copyList}>
            {copied ? "Copied" : "Copy list"}
          </button>
        </div>
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
