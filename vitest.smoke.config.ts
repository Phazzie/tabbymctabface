import { defineConfig } from 'vitest/config';
import { commonTestConfig } from './vitest.config.ts';

export default defineConfig({
  test: {
    ...commonTestConfig,
    include: ['tests/smoke/**/*.smoke.test.ts'],
  },
});
