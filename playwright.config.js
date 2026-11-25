import { loadEnvFile } from "node:process";
import { defineConfig, devices } from "@playwright/test";

try {
  loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI
      ? "node --env-file-if-exists=.env server.js"
      : "npm exec --yes --package=node@22 -- node --env-file-if-exists=.env server.js",
    url: "http://localhost:3000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
