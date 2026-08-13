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
import {
  cleanupExtension,
  ensureInitialized,
  getExtensionContext,
  type ExtensionContext,
  type InitializationResult
} from './bootstrap';
import { Result } from './utils/Result';

describe('bootstrap cold-worker initialization', () => {
  afterEach(() => cleanupExtension());

  it('shares one in-flight initialization across simultaneous events', async () => {
    const context = {} as ExtensionContext;
    let release!: () => void;
    const factory = vi.fn((): Promise<InitializationResult> => new Promise<InitializationResult>(resolve => {
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
    let attempts = 0;
    const factory = vi.fn(async (): Promise<InitializationResult> => {
      attempts += 1;
      return attempts === 1
        ? Result.error({ type: 'StorageInitFailed', details: 'nope', originalError: new Error('nope') })
        : Result.ok(context);
    });

    expect((await ensureInitialized(factory)).ok).toBe(false);
    expect((await ensureInitialized(factory)).ok).toBe(true);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('does not resurrect a context when cleanup invalidates an in-flight initialization', async () => {
    const staleContext = { tabManager: { marker: 'stale' } } as unknown as ExtensionContext;
    const freshContext = { tabManager: { marker: 'fresh' } } as unknown as ExtensionContext;
    let releaseStale!: () => void;
    const staleFactory = vi.fn((): Promise<InitializationResult> => new Promise<InitializationResult>(resolve => {
      releaseStale = () => resolve(Result.ok(staleContext));
    }));

    const staleInitialization = ensureInitialized(staleFactory);
    cleanupExtension();
    const freshInitialization = ensureInitialized(async () => Result.ok(freshContext));
    releaseStale();

    expect((await staleInitialization).ok).toBe(true);
    expect((await freshInitialization).ok).toBe(true);
    expect(getExtensionContext()).toBe(freshContext);
  });

  it('does not let a stale rejection clear a newer initialization promise', async () => {
    const freshContext = {} as ExtensionContext;
    let rejectStale!: (error: Error) => void;
    let releaseFresh!: () => void;
    const staleFactory = () => new Promise<never>((_resolve, reject) => {
      rejectStale = reject;
    });
    const freshFactory = vi.fn((): Promise<InitializationResult> => new Promise<InitializationResult>(resolve => {
      releaseFresh = () => resolve(Result.ok(freshContext));
    }));

    const staleInitialization = ensureInitialized(staleFactory);
    cleanupExtension();
    const freshInitialization = ensureInitialized(freshFactory);
    rejectStale(new Error('stale failure'));

    await staleInitialization;
    expect(ensureInitialized(freshFactory)).toBe(freshInitialization);
    releaseFresh();
    expect((await freshInitialization).ok).toBe(true);
    expect(freshFactory).toHaveBeenCalledOnce();
  });
});
