/** Builds and validates the exact extension directory the browser fixture loads. */
import path from 'node:path';
import { buildExtension } from '../../scripts/build.mjs';

export default async function globalSetup(): Promise<void> {
  const projectRoot = path.resolve(import.meta.dirname, '../..');
  await buildExtension({
    projectRoot,
    outDir: path.join(projectRoot, 'dist'),
    logLevel: 'silent',
  });
}
