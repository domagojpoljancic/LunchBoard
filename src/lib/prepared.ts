import { heatPortionsToBurn, UNDO_WINDOW_MS } from "./inventory";
import { nameKey } from "./name-key";

export type PreparedDishState = {
  id: string;
  name: string;
  nameKey: string;
  portionsRemaining: number;
  location: string;
  linkedMealId: string | null;
  archivedAt: Date | null;
};

export function prepareDishNameKey(name: string): string {
  return nameKey(name);
}

export function applyPortionDecrement(
  portionsRemaining: number,
  dayServings: number,
): { next: number; burned: number; archive: boolean } {
  const burned = heatPortionsToBurn(dayServings, portionsRemaining);
  const next = Math.max(0, portionsRemaining - burned);
  return { next, burned, archive: next === 0 };
}

export function applyPortionRestore(
  portionsRemaining: number,
  burned: number,
): number {
  return Math.max(0, portionsRemaining + Math.max(0, burned));
}

export function softArchiveAtZero(
  portionsRemaining: number,
  now: Date,
): Date | null {
  return portionsRemaining <= 0 ? now : null;
}

export function canUndoArchive(archivedAt: Date | null, now: Date): boolean {
  if (!archivedAt) return false;
  return now.getTime() - archivedAt.getTime() <= UNDO_WINDOW_MS;
}

/** Heat plans and leftovers contribute zero recipe buy lines. */
export function contributesRecipeBuyLines(cookKind: string | null | undefined): boolean {
  if (!cookKind || cookKind === "RECIPE") return true;
  if (cookKind === "HEAT_PREPARED" || cookKind === "LEFTOVER") return false;
  return true;
}
