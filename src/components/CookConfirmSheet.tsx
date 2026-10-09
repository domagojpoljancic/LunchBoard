"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  confirmCookAction,
  dismissCookPrompt,
  skipCookAction,
} from "@/app/actions/cook";
import { weekdayLabel } from "@/lib/weeks";

export type PendingCookItem = {
  id: string;
  date: string;
  mealName?: string | null;
  preparedName?: string | null;
};

const SESSION_KEY = "lb-cook-prompt-later";

export function CookConfirmSheet({
  pending,
  show,
}: {
  pending: PendingCookItem[];
  show: boolean;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(pending);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, start] = useTransition();

  useEffect(() => {
    setQueue(pending);
    const dismissed =
      typeof window !== "undefined" &&
      sessionStorage.getItem(SESSION_KEY) === "1";
    if (show && pending.length > 0 && !dismissed) setOpen(true);
    if (dismissed) setOpen(false);
  }, [pending, show]);

  if (!open || queue.length === 0) return null;

  const current = queue[0];
  const label = current.preparedName
    ? `heat ${current.preparedName}`
    : current.mealName ?? "lunch";
  const prompt = current.preparedName
    ? `Did you heat ${current.preparedName} on ${weekdayLabel(current.date)}?`
    : `Did you cook ${label} on ${weekdayLabel(current.date)}?`;

  function advance() {
    const rest = queue.slice(1);
    setQueue(rest);
    if (rest.length === 0) setOpen(false);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(28,25,21,0.28)] p-4 md:items-center"
      role="dialog"
      aria-label="Confirm lunches"
    >
      <div className="sheet w-full max-w-md space-y-4 p-5 shadow-[var(--shadow)]">
        <p className="text-sm text-[var(--muted)]">
          Confirm last week’s lunches ({queue.length})
        </p>
        <h2 className="font-display text-2xl leading-tight">{prompt}</h2>
        {note ? (
          <p className="text-sm text-[var(--warning)]">{note}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary min-h-11"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const result = await confirmCookAction(current.id);
                if (result.shortfalls?.length) {
                  setNote(
                    `Used what you had; short on ${result.shortfalls
                      .map((s) => s.nameKey)
                      .join(", ")}.`,
                  );
                } else {
                  setNote(null);
                }
                advance();
              })
            }
          >
            Cooked
          </button>
          <button
            type="button"
            className="btn-outline min-h-11"
            disabled={busy}
            onClick={() =>
              start(async () => {
                await skipCookAction(current.id);
                setNote(null);
                advance();
              })
            }
          >
            Skipped
          </button>
          <button
            type="button"
            className="btn-text min-h-11"
            disabled={busy}
            onClick={() =>
              start(async () => {
                sessionStorage.setItem(SESSION_KEY, "1");
                setOpen(false);
                await dismissCookPrompt();
              })
            }
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
