/**
 * FILE: bootstrap.test.ts
 *
 * WHAT: Tests idempotent MV3 dependency initialization.
 * WHY: Concurrent cold-worker events must share one initialization promise.
 * HOW DATA FLOWS:
 *   1. Test factories enter the bootstrap cache through SEAM-32.
 *   2. Initialization Results and cached contexts return to event callers.
 * SEAMS:
 *   IN: Test factories -> bootstrap cache (SEAM-32)
 *   OUT: Bootstrap cache -> initialized extension context (SEAM-32)
 * CONTRACT: Extension bootstrap v1.1.0
 * GENERATED: 2026-08-12
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupExtension,
  ensureInitialized,
  getExtensionContext,
  initializeExtension,
  isInitialized,
  type ExtensionContext,
  type InitializationResult
} from './bootstrap';
import { Result } from './utils/Result';

describe('bootstrap cold-worker initialization', () => {
  afterEach(() => cleanupExtension());

  it('constructs the real production dependency graph and caches it through the sole owner', async () => {
    expect(isInitialized()).toBe(false);

    const initialized = await ensureInitialized();

    expect(initialized.ok).toBe(true);
    if (!initialized.ok) return;
    expect(isInitialized()).toBe(true);
    expect(getExtensionContext()).toBe(initialized.value);
    expect(initialized.value).toMatchObject({
      tabManager: expect.any(Object),
      humorSystem: expect.any(Object),
      easterEggFramework: expect.any(Object),
      quipStorage: expect.any(Object),
      chromeTabsAPI: expect.any(Object),
      chromeNotificationsAPI: expect.any(Object),
      chromeStorageAPI: expect.any(Object),
      usageStats: expect.any(Object)
    });

    const cached = await ensureInitialized();
    expect(cached.ok && cached.value).toBe(initialized.value);
  });

  it('keeps initializeExtension pure when called directly', async () => {
    const initialized = await initializeExtension();

    expect(initialized.ok).toBe(true);
    expect(getExtensionContext()).toBeNull();
    expect(isInitialized()).toBe(false);
  });

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
