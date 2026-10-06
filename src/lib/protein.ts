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

export function confidenceActionLabel(confidence: string): string {
  if (confidence === "KNOW") return "I know how to cook this";
  if (confidence === "PROMPT") return "I roughly know this";
  return "I need the recipe";
}

export function methodLabel(method: string): string {
  switch (method) {
    case "ONE_POT":
      return "One pot";
    case "TRAY":
      return "Tray";
    case "PAN":
      return "Stovetop";
    case "BAKE":
      return "Oven";
    case "ASSEMBLE":
      return "Assemble";
    case "SLOW":
      return "Slow";
    default:
      return "Other";
  }
}

export function roleLabel(role: string): string {
  return role === "PANTRY" ? "Cupboard" : "Buy";
}

export function prepWindowLabel(prepWindow: string): string {
  return prepWindow === "SAME_DAY" ? "At lunch" : "Night before";
}

export function formatAmount(
  quantity: number | null | undefined,
  unit: string | null | undefined,
): string {
  if (quantity == null || Number.isNaN(quantity)) return "";
  const rounded =
    Math.abs(quantity - Math.round(quantity)) < 0.001
      ? Math.round(quantity)
      : Math.round(quantity * 10) / 10;
  if (unit === "G") return `${rounded} g`;
  if (unit === "ML") return `${rounded} ml`;
  if (unit === "BUNCH") return `${rounded} bunch`;
  if (unit === "PIECE") return String(rounded);
  return String(rounded);
}
