"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  confirmPoolCookAction,
  skipPoolCookAction,
} from "@/app/actions/cook";
import { logPoolCook } from "@/app/actions/week";

export type PoolSweepEntry = {
  id: string;
  label: string;
};

/** End-of-week pool sweep: which pool lunches did you cook? */
export function PoolSweepSheet({
  weekEnded,
  entries,
  today,
}: {
  weekEnded: boolean;
  entries: PoolSweepEntry[];
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();

  useEffect(() => {
    const dismissed =
      typeof window !== "undefined" &&
      sessionStorage.getItem("lb-pool-sweep-later") === "1";
    if (weekEnded && entries.length > 0 && !dismissed) setOpen(true);
  }, [weekEnded, entries.length]);

  if (!open || entries.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(28,25,21,0.2)] p-4 md:items-center"
      role="dialog"
      aria-label="Pool week sweep"
    >
      <div className="sheet w-full max-w-md space-y-4 p-5">
        <h2 className="font-display text-2xl">Which pool lunches did you cook?</h2>
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3"
            >
              <span>{entry.label}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary min-h-11 px-3 text-sm"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const instance = await logPoolCook(entry.id, today);
                      await confirmPoolCookAction(instance.id);
                      router.refresh();
                    })
                  }
                >
                  Cooked
                </button>
                <button
                  type="button"
                  className="btn-outline min-h-11 px-3 text-sm"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const instance = await logPoolCook(entry.id, today);
                      await skipPoolCookAction(instance.id);
                      router.refresh();
                    })
                  }
                >
                  Skipped
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            sessionStorage.setItem("lb-pool-sweep-later", "1");
            setOpen(false);
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
