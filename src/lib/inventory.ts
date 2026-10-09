import { nameKey } from "./name-key";

export type InventoryLocation = "PANTRY" | "FREEZER" | "FRIDGE";
export type StockKind = "PROTEIN" | "DRY";

export const PROTEIN_LOCATIONS: InventoryLocation[] = [
  "FREEZER",
  "FRIDGE",
  "PANTRY",
];
export const DRY_LOCATIONS: InventoryLocation[] = [
  "PANTRY",
  "FRIDGE",
  "FREEZER",
];

const PROTEIN_NAME_KEYS = new Set([
  "beef mince",
  "beef",
  "mince",
  "chicken",
  "chicken breast",
  "chicken thigh",
  "turkey",
  "pork",
  "lamb",
  "fish",
  "salmon",
  "tuna",
  "cod",
  "prawns",
  "shrimp",
  "tofu",
  "tempeh",
  "bacon",
  "sausage",
  "sausages",
]);

export function normalizeInventoryUnit(unit: string | null | undefined): string {
  return unit ?? "";
}

export function locationOrder(kind: StockKind): InventoryLocation[] {
  return kind === "PROTEIN" ? [...PROTEIN_LOCATIONS] : [...DRY_LOCATIONS];
}

export function inferStockKind(
  itemNameKey: string,
  roleHint?: string | null,
): StockKind {
  if (roleHint === "PANTRY") return "DRY";
  if (PROTEIN_NAME_KEYS.has(itemNameKey)) return "PROTEIN";
  // Common protein tokens in compound names
  const tokens = itemNameKey.split(" ");
  if (
    tokens.some((t) =>
      [
        "beef",
        "chicken",
        "pork",
        "lamb",
        "turkey",
        "fish",
        "salmon",
        "tuna",
        "mince",
        "tofu",
      ].includes(t),
    )
  ) {
    return "PROTEIN";
  }
  return "DRY";
}

export type InventoryStockRow = {
  id: string;
  nameKey: string;
  unit: string;
  location: InventoryLocation | string;
  quantity: number | null;
};

export type DecrementNeed = {
  name: string;
  nameKey: string;
  unit: string | null;
  quantity: number | null;
  roleHint?: string | null;
};

export type DecrementTouch = {
  inventoryItemId: string;
  delta: number;
  before: number;
  after: number;
  shortfall: number;
};

export type DecrementResult = {
  touches: DecrementTouch[];
  shortfalls: Array<{ nameKey: string; unit: string; amount: number }>;
};

/**
 * Pure inventory decrement across locations.
 * Null recipe quantities produce no numeric delta.
 * Missing stock records a shortfall for the full amount.
 * Quantity never goes below 0.
 */
export function applyInventoryDecrement(
  stock: InventoryStockRow[],
  need: DecrementNeed,
): DecrementResult {
  if (need.quantity == null || need.quantity <= 0) {
    return { touches: [], shortfalls: [] };
  }

  const unit = normalizeInventoryUnit(need.unit);
  const key = need.nameKey || nameKey(need.name);
  const kind = inferStockKind(key, need.roleHint);
  const order = locationOrder(kind);

  const matching = stock.filter(
    (row) => row.nameKey === key && row.unit === unit,
  );

  if (matching.length === 0) {
    return {
      touches: [],
      shortfalls: [{ nameKey: key, unit, amount: need.quantity }],
    };
  }

  let remaining = need.quantity;
  const touches: DecrementTouch[] = [];

  for (const loc of order) {
    if (remaining <= 0) break;
    const rows = matching.filter((r) => r.location === loc);
    for (const row of rows) {
      if (remaining <= 0) break;
      if (row.quantity == null) continue;
      const available = Math.max(0, row.quantity);
      const take = Math.min(available, remaining);
      const after = available - take;
      const shortfallForRow = 0;
      touches.push({
        inventoryItemId: row.id,
        delta: -take,
        before: available,
        after,
        shortfall: shortfallForRow,
      });
      remaining -= take;
      row.quantity = after;
    }
  }

  // Also try any matching rows whose location is unexpected
  if (remaining > 0) {
    for (const row of matching) {
      if (remaining <= 0) break;
      if (order.includes(row.location as InventoryLocation)) continue;
      if (row.quantity == null) continue;
      const available = Math.max(0, row.quantity);
      const take = Math.min(available, remaining);
      touches.push({
        inventoryItemId: row.id,
        delta: -take,
        before: available,
        after: available - take,
        shortfall: 0,
      });
      remaining -= take;
      row.quantity = available - take;
    }
  }

  const shortfalls =
    remaining > 0 ? [{ nameKey: key, unit, amount: remaining }] : [];

  if (shortfalls.length && touches.length) {
    const last = touches[touches.length - 1];
    last.shortfall = remaining;
  }

  return { touches, shortfalls };
}

export function applyInventoryIncrement(
  current: number | null,
  delta: number,
): number {
  const base = current ?? 0;
  return Math.max(0, base + delta);
}

export const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isMutationReversible(input: {
  createdAt: Date;
  reversibleUntil: Date | null;
  reversedAt: Date | null;
  now: Date;
  laterDecrementOnItem: boolean;
}): boolean {
  if (input.reversedAt) return false;
  if (input.laterDecrementOnItem) return false;
  const until =
    input.reversibleUntil ??
    new Date(input.createdAt.getTime() + UNDO_WINDOW_MS);
  return input.now.getTime() <= until.getTime();
}

export function clampPoolTarget(n: number): number {
  return Math.min(7, Math.max(3, Math.round(n)));
}

export function heatPortionsToBurn(
  dayServings: number,
  portionsRemaining: number,
): number {
  return Math.min(Math.max(0, dayServings), Math.max(0, portionsRemaining));
}
