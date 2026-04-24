import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const baseUrlPort = new URL(baseURL).port || "3000";
const shouldRunLocalServer = /^https?:\/\/(127\.0\.0\.1|localhost):3000\b/.test(baseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: shouldRunLocalServer
    ? {
        command: `npx next dev --hostname 127.0.0.1 --port ${baseUrlPort}`,
        env: {
          ...process.env,
          E2E_TEST_MODE: "true",
          NEXT_PUBLIC_E2E_TEST_MODE: "true",
          PLAYWRIGHT_BASE_URL: baseURL,
          NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${baseUrlPort}/api/e2e-backend`,
          PLAYWRIGHT_API_BASE_URL: `http://127.0.0.1:${baseUrlPort}/api/e2e-backend`,
        },
        url: baseURL,
        reuseExistingServer: false,
      }
    : undefined,
});
