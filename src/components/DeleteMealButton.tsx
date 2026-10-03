"use client";

export function DeleteMealButton({
  name,
  action,
}: {
  name: string;
  action: () => Promise<void>;
}) {
  return (
    <button
      type="button"
      className="btn-text muted"
      onClick={() => {
        const ok = window.confirm(
          `Delete ${name}? It will come off any week that uses it.`,
        );
        if (ok) void action();
      }}
    >
      Delete meal
    </button>
  );
}
