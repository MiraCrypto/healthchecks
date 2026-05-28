import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'DATABASE_URL=./e2e-data.db npm run db:push -w backend && DATABASE_URL=./e2e-data.db npm run dev -w backend',
      url: 'http://localhost:8080/health', // checking health route to ensure backend is up
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: './e2e-data.db', // isolate data
      }
    },
    {
      command: 'npm run dev -w frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    }
  ],
});
