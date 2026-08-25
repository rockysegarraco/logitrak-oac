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

/** Trims and collapses internal whitespace, then uppercases for storage/display. */
export function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

/** Deterministic avatar palette class for a set of initials. */
const AVATAR_TONES = [
  "bg-avatar-1 text-avatar-1-foreground",
  "bg-avatar-2 text-avatar-2-foreground",
  "bg-avatar-3 text-avatar-3-foreground",
  "bg-avatar-4 text-avatar-4-foreground",
  "bg-avatar-5 text-avatar-5-foreground",
  "bg-avatar-6 text-avatar-6-foreground",
];

export function avatarTone(initials: string): string {
  const key = (initials || "?").trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
