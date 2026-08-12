import { defineConfig } from 'vitest/config';

export const commonTestConfig = {
  globals: true,
  environment: 'node' as const,
  clearMocks: true,
  mockReset: true,
  restoreMocks: true,
  passWithNoTests: false,
  testTimeout: 10_000,
  hookTimeout: 30_000,
};

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
});
