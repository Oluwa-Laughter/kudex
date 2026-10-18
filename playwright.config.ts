import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3017',
    headless: true,
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start -p 3017',
    url: 'http://localhost:3017',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
