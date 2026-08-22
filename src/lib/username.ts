export const USERNAME_EMAIL_DOMAIN = "shiplist.local";

/** Normalize a username to a lowercase, email-safe handle. */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

/** Deterministic synthetic email used for username-only auth. */
export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${USERNAME_EMAIL_DOMAIN}`;
}

export function initialsFrom(firstName: string, lastName: string, username: string): string {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  const combined = `${a}${b}`.trim();
  return (combined || username.trim().slice(0, 2)).toUpperCase();
}

export function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}
