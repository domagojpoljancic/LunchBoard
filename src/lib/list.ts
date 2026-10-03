import { nameKey } from "./name-key";
import { scaleQuantity } from "./scaling";

export type IngredientLine = {
  name: string;
  quantity: number | null;
  unit: string | null;
  role: "BUY" | "PANTRY" | string;
  variantId?: string | null;
  mealId?: string | null;
  sideId?: string | null;
};

export type DesiredLine = {
  name: string;
  nameKey: string;
  quantity: number | null;
  unit: string | null;
  role: "BUY" | "PANTRY";
};

export type ExistingShopping = {
  name: string;
  nameKey: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  origin: "PLAN" | "CARRIED" | string;
};

export type RebuiltShopping = {
  name: string;
  nameKey: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  origin: "PLAN" | "CARRIED";
};

export function mergeLines(lines: DesiredLine[]): DesiredLine[] {
  const map = new Map<string, DesiredLine>();
  for (const line of lines) {
    const key = `${line.nameKey}::${line.unit ?? ""}::${line.role}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...line });
      continue;
    }
    if (existing.quantity == null && line.quantity == null) {
      continue;
    }
    if (existing.quantity == null || line.quantity == null) {
      existing.quantity = existing.quantity ?? line.quantity;
      continue;
    }
    existing.quantity += line.quantity;
  }
  return [...map.values()];
}

export function collectDayLines(input: {
  baseServings: number;
  dayServings: number;
  selectedVariantId: string | null;
  defaultVariantId: string | null;
  shared: IngredientLine[];
  variantIngredients: IngredientLine[];
  sideIngredients: IngredientLine[];
}): DesiredLine[] {
  const variantId = input.selectedVariantId ?? input.defaultVariantId;
  const raw: IngredientLine[] = [
    ...input.shared.filter((i) => !i.variantId),
    ...input.variantIngredients.filter((i) => i.variantId === variantId),
    ...input.sideIngredients,
  ];

  return raw.map((i) => ({
    name: i.name,
    nameKey: nameKey(i.name),
    quantity: scaleQuantity(
      i.quantity,
      i.unit,
      input.baseServings,
      input.dayServings,
    ),
    unit: i.unit,
    role: i.role === "PANTRY" ? "PANTRY" : "BUY",
  }));
}

function qtyGreater(
  a: number | null | undefined,
  b: number | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return a > b;
}

/**
 * Rebuild buy lines.
 * Match desired lines against existing PLAN and CARRIED rows for checked-state.
 * Unmatched CARRIED rows stay. Unmatched PLAN rows are dropped.
 */
export function rebuildShopping(
  existing: ExistingShopping[],
  desiredBuyLines: DesiredLine[],
): RebuiltShopping[] {
  const working: Array<RebuiltShopping & { _matched?: boolean }> = existing.map(
    (e) => ({
      name: e.name,
      nameKey: e.nameKey,
      quantity: e.quantity,
      unit: e.unit,
      checked: e.checked,
      origin: e.origin === "CARRIED" ? "CARRIED" : "PLAN",
    }),
  );

  for (const desired of desiredBuyLines.filter((d) => d.role === "BUY")) {
    const idx = working.findIndex(
      (w) =>
        !w._matched &&
        w.nameKey === desired.nameKey &&
        (w.unit ?? null) === (desired.unit ?? null),
    );

    if (idx === -1) {
      working.push({
        name: desired.name,
        nameKey: desired.nameKey,
        quantity: desired.quantity,
        unit: desired.unit,
        checked: false,
        origin: "PLAN",
        _matched: true,
      });
      continue;
    }

    const old = working[idx];
    working[idx] = {
      name: desired.name,
      nameKey: desired.nameKey,
      quantity: desired.quantity,
      unit: desired.unit,
      checked: qtyGreater(desired.quantity, old.quantity) ? false : old.checked,
      origin: "PLAN",
      _matched: true,
    };
  }

  return working
    .filter((w) => w._matched || w.origin === "CARRIED")
    .map(({ name, nameKey: key, quantity, unit, checked, origin }) => ({
      name,
      nameKey: key,
      quantity,
      unit,
      checked,
      origin,
    }));
}

export type ExistingPantry = {
  name: string;
  nameKey: string;
  checked: boolean;
};

export function rebuildPantry(
  existing: ExistingPantry[],
  desiredPantryLines: DesiredLine[],
): ExistingPantry[] {
  const desired = mergeLines(
    desiredPantryLines.filter((d) => d.role === "PANTRY"),
  );
  const checked = new Map(existing.map((e) => [e.nameKey, e.checked]));
  return desired.map((d) => ({
    name: d.name,
    nameKey: d.nameKey,
    checked: checked.get(d.nameKey) ?? false,
  }));
}
