export function proteinColor(group: string): string {
  switch (group) {
    case "BEEF":
      return "var(--beef)";
    case "WHITE_MEAT":
      return "var(--white-meat)";
    case "FISH":
      return "var(--fish)";
    case "VEGETARIAN":
    case "VEGAN":
      return "var(--plant)";
    case "DAIRY":
      return "var(--dairy)";
    default:
      return "var(--other)";
  }
}

export function proteinLabel(group: string): string {
  switch (group) {
    case "BEEF":
      return "beef";
    case "WHITE_MEAT":
      return "white meat";
    case "FISH":
      return "fish";
    case "VEGETARIAN":
      return "vegetarian";
    case "VEGAN":
      return "vegan";
    case "DAIRY":
      return "dairy";
    default:
      return "other";
  }
}

export function confidenceLabel(confidence: string): string {
  if (confidence === "KNOW") return "Know";
  if (confidence === "PROMPT") return "Roughly";
  return "Recipe";
}

export function formatAmount(
  quantity: number | null | undefined,
  unit: string | null | undefined,
): string {
  if (quantity == null) return "";
  if (unit === "G") return `${quantity} g`;
  if (unit === "ML") return `${quantity} ml`;
  return String(quantity);
}
