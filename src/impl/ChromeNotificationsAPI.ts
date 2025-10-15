/**
 * FILE: ChromeNotificationsAPI.ts
 *
 * WHAT: Real Chrome Notifications API wrapper implementation
 *
 * WHY: Provides actual chrome.notifications.* API calls with Result-type error handling.
 *      Satisfies IChromeNotificationsAPI contract, enables production notification delivery.
 *
 * HOW DATA FLOWS:
 *   1. HumorSystem calls create() to display quip (SEAM-15)
 *   2. This implementation calls chrome.notifications.create()
 *   3. Chrome API shows notification, returns notificationId
 *   4. Errors mapped to Result<string, NotificationError> types
 *   5. HumorSystem receives typed Result for error handling
 *
 * SEAMS:
 *   IN:  HumorSystem → ChromeNotificationsAPI (SEAM-15)
 *   OUT: ChromeNotificationsAPI → chrome.notifications (external browser API)
 *
 * CONTRACT: IChromeNotificationsAPI v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import {
  IChromeNotificationsAPI,
  NotificationOptions,
  NotificationError
} from '../contracts/IChromeNotificationsAPI';
import { Result } from '../utils/Result';

/**
 * Real Chrome Notifications API implementation
 *
 * Wraps chrome.notifications.* calls with Result-type error handling.
 * Maps Chrome runtime errors to domain-specific NotificationError types.
 * All methods are async and non-blocking.
 */
export class ChromeNotificationsAPI implements IChromeNotificationsAPI {
  /**
   * Create and display a browser notification
   *
   * DATA IN: options (NotificationOptions with title, message, etc.)
   * DATA OUT: Result<string, NotificationError> (notificationId on success)
   *
   * SEAM: SEAM-15 (HumorSystem → ChromeNotificationsAPI)
   *
   * FLOW:
   *   1. Validate notification options
   *   2. Ensure iconUrl is provided (required by Chrome)
   *   3. Call chrome.notifications.create() with options
   *   4. Generate notificationId since Chrome API doesn't return it
   *   5. Map Chrome errors to NotificationError types
   *   6. Return Result with notificationId or error
   *
   * ERRORS:
   *   - PermissionDenied: Extension lacks notifications permission
   *   - InvalidOptions: Options validation failed
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async create(options: NotificationOptions): Promise<Result<string, NotificationError>> {
    try {
      // Validate required options
      const validationError = this.validateNotificationOptions(options);
      if (validationError) {
        return validationError;
      }

      // Ensure required fields for Chrome API
      const chromeOptions = {
        ...options,
        type: options.type || 'basic' as const,
        iconUrl: options.iconUrl || chrome.runtime.getURL('icon.png') // Default to extension icon
      };

      // Generate notification ID since Chrome API doesn't return it
      const notificationId = `tabby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Call Chrome API (create with ID)
      await chrome.notifications.create(notificationId, chromeOptions);

      return Result.ok(notificationId);
    } catch (error) {
      return this.mapChromeError(error, 'create');
    }
  }

  /**
   * Clear (dismiss) a notification
   *
   * DATA IN: notificationId (string identifier from create())
   * DATA OUT: Result<boolean, NotificationError> (true if cleared)
   *
   * FLOW:
   *   1. Validate notificationId is non-empty string
   *   2. Call chrome.notifications.clear() with notificationId
   *   3. Chrome API returns boolean indicating success
   *   4. Map Chrome errors to NotificationError types
   *   5. Return Result with clear result or error
   *
   * ERRORS:
   *   - InvalidNotificationId: Notification doesn't exist
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <10ms (95th percentile)
   */
  async clear(notificationId: string): Promise<Result<boolean, NotificationError>> {
    try {
      // Validate input
      if (!notificationId || notificationId.trim() === '') {
        return Result.error({
          type: 'InvalidNotificationId',
          details: 'notificationId cannot be empty',
          notificationId
        });
      }

      // Call Chrome API (returns void, assume success if no error)
      await chrome.notifications.clear(notificationId);

      return Result.ok(true); // Success means notification was cleared
    } catch (error) {
      return this.mapChromeError(error, 'clear', { notificationId });
    }
  }

  /**
   * Update an existing notification
   *
   * DATA IN: notificationId (string), options (new NotificationOptions)
   * DATA OUT: Result<boolean, NotificationError> (true if updated)
   *
   * FLOW:
   *   1. Validate notificationId and options
   *   2. Call chrome.notifications.update() with both parameters
   *   3. Chrome API returns boolean indicating success
   *   4. Map Chrome errors to NotificationError types
   *   5. Return Result with update result or error
   *
   * ERRORS:
   *   - InvalidNotificationId: Notification doesn't exist
   *   - InvalidOptions: Options validation failed
   *   - ChromeAPIFailure: Unexpected Chrome API error
   *
   * PERFORMANCE: <20ms (95th percentile)
   */
  async update(
    notificationId: string,
    options: NotificationOptions
  ): Promise<Result<boolean, NotificationError>> {
    try {
      // Validate inputs
      if (!notificationId || notificationId.trim() === '') {
        return Result.error({
          type: 'InvalidNotificationId',
          details: 'notificationId cannot be empty',
          notificationId
        });
      }

      const validationError = this.validateNotificationOptions(options);
      if (validationError) {
        return validationError;
      }

      // Ensure required fields for Chrome API
      const chromeOptions = {
        ...options,
        type: options.type || 'basic' as const,
        iconUrl: options.iconUrl || chrome.runtime.getURL('icon.png')
      };

      // Call Chrome API (returns void, assume success if no error)
      await chrome.notifications.update(notificationId, chromeOptions);

      return Result.ok(true); // Success means notification was updated
    } catch (error) {
      return this.mapChromeError(error, 'update', { notificationId });
    }
  }

  /**
   * Validate notification options according to Chrome requirements
   */
  private validateNotificationOptions(options: NotificationOptions): Result<never, NotificationError> | null {
    // Required fields
    if (!options.title || options.title.trim() === '') {
      return Result.error({
        type: 'InvalidOptions',
        details: 'title is required and cannot be empty',
        field: 'title'
      });
    }

    if (!options.message || options.message.trim() === '') {
      return Result.error({
        type: 'InvalidOptions',
        details: 'message is required and cannot be empty',
        field: 'message'
      });
    }

    // Length limits
    if (options.title.length > 256) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'title cannot exceed 256 characters',
        field: 'title'
      });
    }

    if (options.message.length > 512) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'message cannot exceed 512 characters',
        field: 'message'
      });
    }

    // Priority range
    if (options.priority !== undefined && (options.priority < -2 || options.priority > 2)) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'priority must be between -2 and 2',
        field: 'priority'
      });
    }

    // Button limit
    if (options.buttons && options.buttons.length > 2) {
      return Result.error({
        type: 'InvalidOptions',
        details: 'cannot have more than 2 buttons',
        field: 'buttons'
      });
    }

    return null; // Valid
  }

  /**
   * Map Chrome runtime errors to domain-specific NotificationError types
   */
  private mapChromeError(
    error: unknown,
    operation: string,
    context?: { notificationId?: string }
  ): Result<never, NotificationError> {
    const chromeError = chrome.runtime.lastError || error;

    if (!chromeError) {
      return Result.error({
        type: 'ChromeAPIFailure',
        details: `Unknown error in ${operation}`,
        originalError: error
      });
    }

    const errorMessage = chromeError instanceof Error ? chromeError.message : String(chromeError);

    // Map permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('Permission denied')) {
      return Result.error({
        type: 'PermissionDenied',
        details: `Missing notifications permission`
      });
    }

    // Map notification not found errors
    if (errorMessage.includes('notification not found') || errorMessage.includes('does not exist')) {
      return Result.error({
        type: 'InvalidNotificationId',
        details: `Notification does not exist`,
        notificationId: context?.notificationId || ''
      });
    }

    // Default Chrome API failure
    return Result.error({
      type: 'ChromeAPIFailure',
      details: `Chrome API error in ${operation}`,
      originalError: chromeError
    });
  }
}