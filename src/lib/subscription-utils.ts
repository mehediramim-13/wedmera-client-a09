export function isPremiumPlan(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase().startsWith("premium");
}
