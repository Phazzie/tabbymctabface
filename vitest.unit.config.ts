import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
  },
});
