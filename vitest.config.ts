import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['shared/src/**/*.ts', 'shared/*.ts', 'backend/src/**/*.ts', 'frontend/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/types/**', 'backend/src/db/**', 'shared/check.ts', 'shared/ping.ts', 'shared/user.ts', 'backend/src/index.ts', 'frontend/src/vite-env.d.ts'],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 60,
        statements: 80
      }
    }
  },
});
