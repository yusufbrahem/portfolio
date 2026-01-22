import "server-only";

type RequiredEnvVar = "DATABASE_URL" | "AUTH_SECRET";

function requireEnv(name: RequiredEnvVar): string {
  const value = process.env[name];
  if (!value) {
    // Fail fast with a clear message (no fallback values).
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Set it in your .env.local (development) or your hosting provider (production).`
    );
  }
  return value;
}

/**
 * Get minimum password length from environment variable.
 * Defaults to 6 for development, should be set to 8+ for UAT/production.
 */
function getMinPasswordLength(): number {
  const value = process.env.MIN_PASSWORD_LENGTH;
  if (value) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Default to 6 for development
  return 6;
}

/**
 * Centralized runtime validation for required *server-side* env vars.
 * Import from here instead of reading process.env directly for secrets.
 */
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  AUTH_SECRET: requireEnv("AUTH_SECRET"),
  MIN_PASSWORD_LENGTH: getMinPasswordLength(),
} as const;

export function validateRequiredEnv(): void {
  // Accessing `env` already validates; keep a callable for explicit validation sites.
  void env.DATABASE_URL;
  void env.AUTH_SECRET;
}

