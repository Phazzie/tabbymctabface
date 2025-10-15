/**
 * FILE: MockObservable.ts
 * 
 * WHAT: Mock Observable<T> implementation - simple pub/sub for testing
 * 
 * WHY: IHumorSystem.notifications$ returns Observable<QuipNotification>.
 *      Need minimal Observable implementation for mocks and tests (no RxJS dependency).
 * 
 * HOW DATA FLOWS:
 *   1. Consumer calls subscribe(observer)
 *   2. Observer function stored in observers[]
 *   3. Producer calls emit(value)
 *   4. All observers receive value
 *   5. Consumer can unsubscribe via Subscription
 * 
 * SEAMS:
 *   IN:  HumorSystem → Observable (SEAM-10, SEAM-23 - notifications$)
 *   OUT: Observable → UI (subscribers receive notifications)
 * 
 * CONTRACT: Observable<T> (standard interface)
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

/**
 * Simple Observable interface
 * 
 * Minimal reactive stream for pub/sub communication
 */
export interface Observable<T> {
  /**
   * Subscribe to Observable values
   * 
   * @param observer - Callback receiving emitted values
   * @returns Subscription with unsubscribe method
   */
  subscribe(observer: (value: T) => void): Subscription;
}

/**
 * Subscription handle
 * 
 * Allows consumer to stop receiving values
 */
export interface Subscription {
  /**
   * Stop receiving values from Observable
   */
  unsubscribe(): void;
}

/**
 * Mock Observable implementation
 * 
 * Provides simple pub/sub for testing and development.
 * No complex operators, just subscribe/emit.
 * 
 * MOCK BEHAVIOR:
 * - Stores observers in array
 * - emit() broadcasts to all observers
 * - unsubscribe() removes specific observer
 * - Supports multiple subscribers
 * - Synchronous delivery (no scheduling)
 */
export class MockObservable<T> implements Observable<T> {
  private observers: ((value: T) => void)[] = [];

  /**
   * Subscribe to Observable values
   * 
   * DATA IN: observer: (value: T) => void
   * DATA OUT: Subscription {unsubscribe}
   * 
   * FLOW:
   *   1. Add observer to observers[]
   *   2. Return Subscription with unsubscribe callback
   *   3. unsubscribe removes observer from array
   * 
   * PERFORMANCE: <1ms (in-memory array operation)
   */
  subscribe(observer: (value: T) => void): Subscription {
    this.observers.push(observer);

    return {
      unsubscribe: () => {
        this.observers = this.observers.filter(o => o !== observer);
      },
    };
  }

  /**
   * Emit value to all observers
   * 
   * Helper method for testing - allows triggering Observable values
   * 
   * DATA IN: value: T
   * DATA OUT: void (side effect: calls all observers)
   * 
   * FLOW:
   *   1. Iterate over observers[]
   *   2. Call each observer with value
   *   3. Synchronous delivery
   * 
   * PERFORMANCE: <1ms per observer
   */
  emit(value: T): void {
    this.observers.forEach(observer => {
      try {
        observer(value);
      } catch (err) {
        // Prevent one failing observer from breaking others
        console.error('MockObservable: Observer threw error', err);
      }
    });
  }

  /**
   * Get current subscriber count
   * 
   * Helper for testing - verify subscriptions were added
   */
  getSubscriberCount(): number {
    return this.observers.length;
  }

  /**
   * Reset to initial state
   * 
   * Helper for testing - clear all subscriptions
   */
  reset(): void {
    this.observers = [];
  }

  /**
   * Get all observers (for inspection)
   * 
   * Helper for advanced testing scenarios
   */
  getObservers(): ((value: T) => void)[] {
    return [...this.observers];
  }
}
