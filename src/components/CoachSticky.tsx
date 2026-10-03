"use client";

export function CoachSticky({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky-note">
      <div>{children}</div>
      {actions ? <div className="mt-2 flex gap-3">{actions}</div> : null}
    </div>
  );
}
