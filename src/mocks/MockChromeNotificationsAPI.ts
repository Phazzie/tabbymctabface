/**
 * FILE: MockChromeNotificationsAPI.ts
 * 
 * WHAT: Mock implementation of IChromeNotificationsAPI - simulates notification display without browser
 * 
 * WHY: Enables development and testing without browser environment. Proves IChromeNotificationsAPI
 *      contract is implementable. Provides test double for unit testing HumorSystem.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls create() to display quip (SEAM-15)
 *   2. Mock stores notification in Map<id, options>
 *   3. Mock returns fake notificationId
 *   4. HumorSystem receives valid contract response
 *   5. NO actual browser notifications shown
 * 
 * SEAMS:
 *   IN:  HumorSystem → ChromeNotificationsAPI (SEAM-15)
 *   OUT: None (mock terminates seam with fake data)
 * 
 * CONTRACT: IChromeNotificationsAPI v1.0.0
 * GENERATED: 2025-10-12
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
  IChromeNotificationsAPI,
  NotificationOptions,
  NotificationError,
} from '../contracts/IChromeNotificationsAPI';

/**
 * Mock implementation of IChromeNotificationsAPI
 * 
 * Provides fake Chrome Notifications API responses for testing and development.
 * Stores notifications in-memory, supports inspecting notification history.
 * 
 * MOCK BEHAVIOR:
 * - Returns fake notification IDs
 * - Stores notification options in Map
 * - Auto-increments IDs (nextNotificationId)
 * - Validates inputs per contract
 * - Tracks call history for test assertions
 */
export class MockChromeNotificationsAPI implements IChromeNotificationsAPI {
  private notifications = new Map<string, NotificationOptions>();
  private nextNotificationId = 1;
  private callHistory: MockCallRecord[] = [];

  /**
   * Create and display a browser notification
   * 
   * DATA IN: options: NotificationOptions
   * DATA OUT: Result<string, NotificationError> (notificationId or error)
   * 
   * SEAM: SEAM-15 (HumorSystem → ChromeNotificationsAPI)
   * 
   * FLOW:
   *   1. Validate options (title and message required)
   *   2. Generate unique notificationId
   *   3. Store notification in Map
   *   4. Return notificationId
   * 
   * ERRORS:
   *   - InvalidOptions: Missing title or message
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async create(options: NotificationOptions): Promise<Result<string, NotificationError>> {
    this.callHistory.push({ method: 'create', args: [options], timestamp: Date.now() });

    // Validate required fields
    if (!options.title || options.title.trim().length === 0) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification title is required',
        field: 'title',
      });
    }

    if (!options.message || options.message.trim().length === 0) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification message is required',
        field: 'message',
      });
    }

    // Validate length constraints
    if (options.title.length > 256) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification title exceeds 256 characters',
        field: 'title',
      });
    }

    if (options.message.length > 512) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification message exceeds 512 characters',
        field: 'message',
      });
    }

    // Create notification
    const notificationId = `mock-notif-${this.nextNotificationId++}`;
    this.notifications.set(notificationId, { ...options });

    return Result.ok(notificationId);
  }

  /**
   * Clear (dismiss) a notification
   * 
   * DATA IN: notificationId: string
   * DATA OUT: Result<boolean, NotificationError> (true if existed)
   * 
   * FLOW:
   *   1. Check if notification exists
   *   2. Delete from Map
   *   3. Return true if existed, false if not
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async clear(notificationId: string): Promise<Result<boolean, NotificationError>> {
    this.callHistory.push({ method: 'clear', args: [notificationId], timestamp: Date.now() });

    const existed = this.notifications.has(notificationId);
    this.notifications.delete(notificationId);
    return Result.ok(existed);
  }

  /**
   * Update an existing notification
   * 
   * DATA IN: notificationId: string, options: NotificationOptions
   * DATA OUT: Result<boolean, NotificationError> (true if updated)
   * 
   * FLOW:
   *   1. Check if notification exists
   *   2. If not, return false
   *   3. Validate new options
   *   4. Update notification in Map
   *   5. Return true
   * 
   * ERRORS:
   *   - InvalidOptions: Invalid title/message
   * 
   * PERFORMANCE: <5ms (mock, no I/O)
   */
  async update(
    notificationId: string,
    options: NotificationOptions
  ): Promise<Result<boolean, NotificationError>> {
    this.callHistory.push({ method: 'update', args: [notificationId, options], timestamp: Date.now() });

    if (!this.notifications.has(notificationId)) {
      return Result.ok(false);
    }

    // Validate options
    if (!options.title || options.title.trim().length === 0) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification title is required',
        field: 'title',
      });
    }

    if (!options.message || options.message.trim().length === 0) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'Notification message is required',
        field: 'message',
      });
    }

    this.notifications.set(notificationId, { ...options });
    return Result.ok(true);
  }

  // ========================================
  // MOCK HELPER METHODS
  // ========================================

  /**
   * Get all mock notifications
   * 
   * Used by tests to inspect notification history
   */
  getMockNotifications(): NotificationOptions[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get notification by ID
   * 
   * Used by tests to inspect specific notification
   */
  getMockNotificationById(notificationId: string): NotificationOptions | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * Reset mock to initial state
   * 
   * Call between tests to ensure isolation
   */
  reset(): void {
    this.notifications.clear();
    this.nextNotificationId = 1;
    this.callHistory = [];
  }

  /**
   * Get call history for test assertions
   * 
   * Enables verifying mock was called with expected arguments
   */
  getCallHistory(): MockCallRecord[] {
    return [...this.callHistory];
  }
}

/**
 * Record of mock method calls
 * 
 * Used for test assertions - verify mock was called correctly
 */
export interface MockCallRecord {
  method: string;
  args: any[];
  timestamp: number;
}
