export type ValueCase = "sentence" | "upper";

/** Softens a SHOUTED value to sentence case; leaves mixed-case text alone. */
export function toSentenceCase(value: string): string {
  if (!value) return value;
  if (/[a-z]/.test(value)) return value;
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function applyValueCase(value: string, mode: ValueCase): string {
  if (!value) return value;
  return mode === "upper" ? value.toUpperCase() : toSentenceCase(value);
}
