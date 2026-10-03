import { nameKey } from "./name-key";

const PANTRY_KEYS = new Set(
  [
    "salt",
    "black pepper",
    "pepper",
    "olive oil",
    "oil",
    "vegetable oil",
    "soy sauce",
    "sugar",
    "cumin",
    "oregano",
    "dried oregano",
    "paprika",
    "sweet paprika",
    "chili flakes",
    "garlic powder",
    "vinegar",
    "miso",
    "sesame oil",
    "sesame",
    "nutmeg",
    "caraway",
  ].map(nameKey),
);

export function isPantryDefault(name: string): boolean {
  return PANTRY_KEYS.has(nameKey(name));
}

export function defaultRole(name: string): "BUY" | "PANTRY" {
  return isPantryDefault(name) ? "PANTRY" : "BUY";
}
