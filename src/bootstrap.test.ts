/**
 * FILE: bootstrap.test.ts
 *
 * WHAT: Tests idempotent MV3 dependency initialization.
 * WHY: Concurrent cold-worker events must share one initialization promise.
 * SEAMS: Chrome lifecycle -> bootstrap context (SEAM-32)
 * CONTRACT: Extension bootstrap v1.1.0
 * GENERATED: 2026-08-12
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanupExtension, ensureInitialized, type ExtensionContext } from './bootstrap';
import { Result } from './utils/Result';

describe('bootstrap cold-worker initialization', () => {
  afterEach(() => cleanupExtension());

  it('shares one in-flight initialization across simultaneous events', async () => {
    const context = {} as ExtensionContext;
    let release!: () => void;
    const factory = vi.fn(() => new Promise(resolve => {
      release = () => resolve(Result.ok(context));
    }));

    const first = ensureInitialized(factory);
    const second = ensureInitialized(factory);
    const third = ensureInitialized(factory);
    expect(factory).toHaveBeenCalledOnce();
    release();

    expect((await first).ok).toBe(true);
    expect(await second).toBe(await third);
    expect(factory).toHaveBeenCalledOnce();
  });

  it('retries after a failed initialization rather than caching failure forever', async () => {
    const context = {} as ExtensionContext;
    const factory = vi.fn()
      .mockResolvedValueOnce(Result.error({ type: 'StorageInitFailed', details: 'nope', originalError: new Error('nope') }))
      .mockResolvedValueOnce(Result.ok(context));

    expect((await ensureInitialized(factory)).ok).toBe(false);
    expect((await ensureInitialized(factory)).ok).toBe(true);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
