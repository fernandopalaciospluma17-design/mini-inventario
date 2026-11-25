import { loadEnvFile } from 'node:process';
import { defineConfig, devices } from '@playwright/test';

try {
  loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const port = Number(process.env.PORT || 3000);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm exec --yes --package=node@22 -- node --env-file-if-exists=.env server.js',
    url: `http://localhost:${port}/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
