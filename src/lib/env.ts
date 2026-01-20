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
 * Centralized runtime validation for required *server-side* env vars.
 * Import from here instead of reading process.env directly for secrets.
 */
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  AUTH_SECRET: requireEnv("AUTH_SECRET"),
} as const;

export function validateRequiredEnv(): void {
  // Accessing `env` already validates; keep a callable for explicit validation sites.
  void env.DATABASE_URL;
  void env.AUTH_SECRET;
}

