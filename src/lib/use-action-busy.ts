"use client";

import { useCallback, useTransition } from "react";
import { useActionToast } from "@/components/ActionToast";

/**
 * Small helper around `useTransition` for server-action buttons: tracks a
 * `pending` flag while the action runs and, on failure, surfaces the error
 * through the shared `ActionToast` with a retry that replays the same call.
 */
export function useActionBusy() {
  const [pending, startTransition] = useTransition();
  const { showError } = useActionToast();

  const run = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(async () => {
        try {
          await action();
        } catch (err) {
          const message = err instanceof Error ? err.message : undefined;
          showError(message, () => run(action));
        }
      });
    },
    [showError],
  );

  return { pending, run };
}
