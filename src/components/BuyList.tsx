"use client";

import { useEffect, useState, useTransition } from "react";
import { addPurchaseToInventory } from "@/app/actions/inventory";
import { togglePantryItem, toggleShoppingItem } from "@/app/actions/list";
import {
  adviseStock,
  softNetAgainstInventory,
  shouldHideSoftNettedLine,
  type BuyLineForAdvice,
} from "@/lib/list-netting";
import type { InventoryStockRow } from "@/lib/inventory";
import { formatAmount } from "@/lib/protein";

function CheckRow({
  id,
  checked,
  label,
  amount,
  advice,
  softNetNote,
  onToggle,
  onCheckedOfferInventory,
}: {
  id: string;
  checked: boolean;
  label: string;
  amount?: string;
  advice?: string | null;
  softNetNote?: string | null;
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onCheckedOfferInventory?: (id: string) => void;
}) {
  const [on, setOn] = useState(checked);

  useEffect(() => {
    setOn(checked);
  }, [checked]);

  return (
    <li
      className={`border-b border-[var(--line)] py-2 ${on ? "opacity-50" : ""}`}
    >
      <div className="flex min-h-14 items-center gap-3">
        <input
          type="checkbox"
          className="h-[22px] w-[22px]"
          checked={on}
          onChange={(event) => {
            const next = event.target.checked;
            setOn(next);
            void onToggle(id, next)
              .then(() => {
                if (next) onCheckedOfferInventory?.(id);
              })
              .catch(() => setOn(!next));
          }}
        />
        <span className="flex-1 text-lg">{label}</span>
        {amount ? <span className="font-display text-lg">{amount}</span> : null}
      </div>
      {advice ? (
        <p className="ml-9 text-sm text-[var(--muted)]">{advice}</p>
      ) : null}
      {softNetNote ? (
        <p className="ml-9 text-sm text-[var(--muted)]">{softNetNote}</p>
      ) : null}
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
  inventory,
  addPurchasePreference,
  applyStockMode = false,
}: {
  planItems: Array<{
    id: string;
    name: string;
    nameKey: string;
    quantity: number | null;
    unit: string | null;
    checked: boolean;
    origin: string;
  }>;
  carriedItems: Array<{
    id: string;
    name: string;
    nameKey: string;
    quantity: number | null;
    unit: string | null;
    checked: boolean;
    origin: string;
  }>;
  pantryItems: Array<{
    id: string;
    name: string;
    checked: boolean;
  }>;
  inventory: InventoryStockRow[];
  addPurchasePreference: boolean | null;
  applyStockMode?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [applyStock, setApplyStock] = useState(false);
  const [purchaseOffer, setPurchaseOffer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [rememberPurchase, setRememberPurchase] = useState(false);
  const [busy, start] = useTransition();

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

  function renderItem(
    item: {
      id: string;
      name: string;
      nameKey: string;
      quantity: number | null;
      unit: string | null;
      checked: boolean;
      origin: string;
    },
  ) {
    const line: BuyLineForAdvice = {
      name: item.name,
      nameKey: item.nameKey,
      quantity: item.quantity,
      unit: item.unit,
      origin: item.origin,
    };
    const advice = adviseStock(line, inventory);
    const adviceText =
      advice.kind === "HAVE" || advice.kind === "DIFFERENT_UNIT"
        ? advice.message
        : null;

    const net = softNetAgainstInventory(line, inventory, {
      apply: applyStock,
    });
    if (shouldHideSoftNettedLine(net)) return null;

    const softNetNote =
      applyStock && net.covered && net.forceVisible
        ? "Covered by stock (still carried)"
        : applyStock && net.applied && !net.covered
          ? `After stock: ${formatAmount(net.quantity, item.unit)}`
          : applyStock && net.covered
            ? "Covered by stock"
            : null;

    const displayQty = applyStock && net.applied ? net.quantity : item.quantity;

    return (
      <CheckRow
        key={item.id}
        id={item.id}
        checked={item.checked}
        label={item.name}
        amount={formatAmount(displayQty, item.unit)}
        advice={adviceText}
        softNetNote={softNetNote}
        onToggle={toggleShoppingItem}
        onCheckedOfferInventory={
          addPurchasePreference === false
            ? undefined
            : (id) => {
                if (item.quantity == null) return;
                if (addPurchasePreference === true) {
                  start(async () => {
                    await addPurchaseToInventory({
                      shoppingItemId: id,
                      location: "PANTRY",
                      remember: true,
                    });
                  });
                  return;
                }
                setPurchaseOffer({ id, name: item.name });
              }
        }
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[1.2fr_0.8fr] md:p-6">
      <section className="sheet p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">To buy</h1>
          <div className="flex flex-wrap gap-2">
            {applyStockMode ? (
              <button
                type="button"
                className={applyStock ? "btn-primary" : "btn-outline"}
                onClick={() => setApplyStock((v) => !v)}
              >
                {applyStock ? "Stock applied" : "Apply stock to list"}
              </button>
            ) : null}
            <button type="button" className="btn-outline" onClick={copyList}>
              {copied ? "Copied" : "Copy list"}
            </button>
          </div>
        </div>
        {planItems.length === 0 && carriedItems.length === 0 ? (
          <p className="text-[var(--muted)]">
            Nothing to buy yet. Place a lunch on the board.
          </p>
        ) : (
          <ul>{planItems.map((item) => renderItem(item))}</ul>
        )}

        {carriedItems.length > 0 ? (
          <div className="mt-8">
            <h2 className="section-label mb-2">Still to buy</h2>
            <ul>{carriedItems.map((item) => renderItem(item))}</ul>
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

      {purchaseOffer ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(28,25,21,0.28)] p-4 md:items-center"
          role="dialog"
        >
          <div className="sheet w-full max-w-sm space-y-4 p-5">
            <h2 className="font-display text-2xl">
              Add {purchaseOffer.name} to pantry inventory?
            </h2>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className="h-[22px] w-[22px]"
                checked={rememberPurchase}
                onChange={(e) => setRememberPurchase(e.target.checked)}
              />
              <span>Remember this choice</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    await addPurchaseToInventory({
                      shoppingItemId: purchaseOffer.id,
                      location: "PANTRY",
                      remember: rememberPurchase ? true : undefined,
                    });
                    setPurchaseOffer(null);
                  })
                }
              >
                Add
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  if (rememberPurchase) {
                    start(async () => {
                      const { setAddPurchasePreference } = await import(
                        "@/app/actions/inventory"
                      );
                      await setAddPurchasePreference(false);
                    });
                  }
                  setPurchaseOffer(null);
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
