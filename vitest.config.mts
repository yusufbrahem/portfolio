import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "server-only": path.resolve(dirname, "vitest/server-only-stub.ts"),
      "@/vitest/test-prisma": path.resolve(dirname, "vitest/test-prisma.ts"),
    },
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["**/*.unit.test.{ts,tsx}", "**/*.unit.spec.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
        },
      },
      {
        test: {
          name: "integration",
          include: [
            "**/*.integration.test.{ts,tsx}",
            "**/*.integration.spec.{ts,tsx}",
            "src/**/*.integration.test.{ts,tsx}",
            "src/**/*.integration.spec.{ts,tsx}",
          ],
          environment: "node",
          globals: true,
          setupFiles: ["./vitest/setup.integration.ts"],
        },
      },
    ],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/e2e/**",
      "playwright.config.ts",
    ],
  },
});
