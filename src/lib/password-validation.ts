import "server-only";
import { env } from "./env";

/**
 * Get the minimum password length requirement.
 * This is configurable via MIN_PASSWORD_LENGTH environment variable.
 * Defaults to 6 for development, should be 8+ for UAT/production.
 */
export function getMinPasswordLength(): number {
  return env.MIN_PASSWORD_LENGTH;
}

/**
 * Validate password length.
 * Throws an error if password is too short.
 */
export function validatePasswordLength(password: string): void {
  const minLength = getMinPasswordLength();
  if (!password || password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} character${minLength !== 1 ? "s" : ""} long`);
  }
}
