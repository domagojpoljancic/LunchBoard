"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastState = {
  message: string;
  retry?: () => void;
} | null;

const ToastContext = createContext<{
  showError: (message?: string, retry?: () => void) => void;
  clear: () => void;
} | null>(null);

export function ActionToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<ToastState>(null);
  const showError = useCallback((message?: string, retry?: () => void) => {
    setToast({
      message: message || "Couldn't save. Try again.",
      retry,
    });
  }, []);
  const clear = useCallback(() => setToast(null), []);
  const value = useMemo(
    () => ({ showError, clear }),
    [showError, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow)]">
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.retry ? (
            <button
              type="button"
              className="btn-text text-sm"
              onClick={() => {
                const retry = toast.retry;
                clear();
                retry?.();
              }}
            >
              Retry
            </button>
          ) : (
            <button type="button" className="btn-text muted text-sm" onClick={clear}>
              Dismiss
            </button>
          )}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useActionToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showError: () => undefined,
      clear: () => undefined,
    };
  }
  return ctx;
}
