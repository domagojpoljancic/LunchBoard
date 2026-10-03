export type Unit = "G" | "ML" | "PIECE";

function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

export function scaleQuantity(
  quantity: number | null | undefined,
  unit: Unit | string | null | undefined,
  baseServings: number,
  dayServings: number,
): number | null {
  if (quantity == null) return null;
  if (baseServings <= 0) return quantity;
  const raw = (quantity * dayServings) / baseServings;

  if (unit === "PIECE") {
    let result = roundHalfUp(raw);
    if (raw > 0 && result === 0) result = 1;
    return result;
  }

  if (unit === "G" || unit === "ML") {
    if (raw >= 20) {
      return roundHalfUp(raw / 5) * 5;
    }
    return roundHalfUp(raw);
  }

  return roundHalfUp(raw);
}
