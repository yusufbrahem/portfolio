import "server-only";

type RequiredEnvVar = "ADMIN_PASSWORD" | "DATABASE_URL";

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
 * Centralized runtime validation for required *server-side* env vars.
 * Import from here instead of reading process.env directly for secrets.
 */
export const env = {
  ADMIN_PASSWORD: requireEnv("ADMIN_PASSWORD"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
} as const;

export function validateRequiredEnv(): void {
  // Accessing `env` already validates; keep a callable for explicit validation sites.
  void env.ADMIN_PASSWORD;
  void env.DATABASE_URL;
}

