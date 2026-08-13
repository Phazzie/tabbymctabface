/** Cross-platform cleanup for generated release artifacts. */
import { rm } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
await Promise.all([
  rm(path.join(projectRoot, 'dist'), { recursive: true, force: true }),
  rm(path.join(projectRoot, 'coverage'), { recursive: true, force: true }),
  rm(path.join(projectRoot, 'playwright-report'), { recursive: true, force: true }),
  rm(path.join(projectRoot, 'test-results'), { recursive: true, force: true }),
]);
