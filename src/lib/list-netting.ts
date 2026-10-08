import { normalizeInventoryUnit, type InventoryStockRow } from "./inventory";
import { nameKey } from "./name-key";

export type BuyLineForAdvice = {
  name: string;
  nameKey: string;
  quantity: number | null;
  unit: string | null;
  origin: "PLAN" | "CARRIED" | string;
};

export type StockAdvice =
  | {
      kind: "HAVE";
      have: number;
      unit: string;
      message: string;
    }
  | {
      kind: "DIFFERENT_UNIT";
      message: string;
    }
  | {
      kind: "NONE";
    };

/** Mode A: advisory only — does not change buy quantities. */
export function adviseStock(
  line: BuyLineForAdvice,
  inventory: InventoryStockRow[],
): StockAdvice {
  const key = line.nameKey || nameKey(line.name);
  const unit = normalizeInventoryUnit(line.unit);
  const sameName = inventory.filter((i) => i.nameKey === key);
  if (sameName.length === 0) return { kind: "NONE" };

  const sameUnit = sameName.filter((i) => i.unit === unit);
  if (sameUnit.length === 0) {
    return {
      kind: "DIFFERENT_UNIT",
      message: "You have this under a different unit",
    };
  }

  const have = sameUnit.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
  const unitLabel = unit === "G" ? "g" : unit === "ML" ? "ml" : unit === "PIECE" ? "" : unit;
  const haveText =
    unit === "PIECE" || unit === ""
      ? `${have}`
      : `${have} ${unitLabel}`.trim();

  return {
    kind: "HAVE",
    have,
    unit,
    message: `You already have ~${haveText}`,
  };
}

export type SoftNetResult = {
  quantity: number | null;
  covered: boolean;
  /** True when line should stay visible even if covered (CARRIED). */
  forceVisible: boolean;
  applied: boolean;
};

/**
 * Mode B soft net — view-only until Apply.
 * Never auto-hides CARRIED lines.
 */
export function softNetAgainstInventory(
  line: BuyLineForAdvice,
  inventory: InventoryStockRow[],
  options?: { apply?: boolean },
): SoftNetResult {
  const apply = options?.apply ?? false;
  const forceVisible = line.origin === "CARRIED";

  if (line.quantity == null) {
    return {
      quantity: null,
      covered: false,
      forceVisible,
      applied: false,
    };
  }

  const advice = adviseStock(line, inventory);
  if (advice.kind !== "HAVE") {
    return {
      quantity: line.quantity,
      covered: false,
      forceVisible,
      applied: false,
    };
  }

  const residual = Math.max(0, line.quantity - advice.have);
  const covered = residual <= 0;

  if (!apply) {
    return {
      quantity: line.quantity,
      covered,
      forceVisible,
      applied: false,
    };
  }

  return {
    quantity: covered ? 0 : residual,
    covered,
    forceVisible,
    applied: true,
  };
}

export function shouldHideSoftNettedLine(result: SoftNetResult): boolean {
  if (!result.applied || !result.covered) return false;
  if (result.forceVisible) return false;
  return true;
}
