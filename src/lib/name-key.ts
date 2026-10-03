export function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
