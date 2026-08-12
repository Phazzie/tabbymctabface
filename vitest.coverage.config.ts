import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/contracts/**',
        'src/mocks/**',
      ],
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 77,
        functions: 80,
        statements: 76,
        branches: 70,
      },
    },
  },
});
