/**
 * FILE: IChromeNotificationsAPI.ts
 * 
 * WHAT: Contract for Chrome Notifications API wrapper - abstracts chrome.notifications.* calls
 * 
 * WHY: Wraps Chrome notification APIs behind testable interface with Result-type error handling.
 *      Enables unit testing without browser, maps Chrome errors to domain types.
 * 
 * HOW DATA FLOWS:
 *   1. HumorSystem calls create() to display quip (SEAM-15)
 *   2. Implementation calls chrome.notifications.create()
 *   3. Chrome API shows notification, returns notificationId
 *   4. Wrapper maps to Result<string, NotificationError>
 *   5. HumorSystem receives typed Result
 * 
 * SEAMS:
 *   IN:  HumorSystem → ChromeNotificationsAPI (SEAM-15)
 *   OUT: ChromeNotificationsAPI → chrome.notifications (external browser API)
 * 
 * CONTRACT: IChromeNotificationsAPI v1.0.0
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';

/**
 * CONTRACT: IChromeNotificationsAPI
 * VERSION: 1.0.0
 * 
 * Chrome Notifications API wrapper providing:
 * - Result-type error handling (no exceptions)
 * - Domain-specific error types
 * - Testable interface (mockable)
 * - Type-safe Chrome notification interactions
 * 
 * PERFORMANCE: <20ms per call (95th percentile)
 * All methods are async and non-blocking
 */
export interface IChromeNotificationsAPI {
  /**
   * Create and display a browser notification
   * 
   * SEAM: SEAM-15 (HumorSystem → ChromeNotificationsAPI)
   * 
   * INPUT:
   *   - options: NotificationOptions
   * 
   * OUTPUT:
   *   - Success: string (notificationId)
   *   - Error: NotificationError
   * 
   * ERRORS:
   *   - PermissionDenied: Extension lacks notifications permission
   *   - InvalidOptions: Options validation failed
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   * 
   * @param options - Notification configuration
   * @returns Result with notificationId or error
   */
  create(options: NotificationOptions): Promise<Result<string, NotificationError>>;

  /**
   * Clear (dismiss) a notification
   * 
   * INPUT:
   *   - notificationId: string (valid notification ID)
   * 
   * OUTPUT:
   *   - Success: boolean (true if notification was cleared)
   *   - Error: NotificationError
   * 
   * ERRORS:
   *   - InvalidNotificationId: Notification doesn't exist
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <10ms (95th percentile)
   */
  clear(notificationId: string): Promise<Result<boolean, NotificationError>>;

  /**
   * Update an existing notification
   * 
   * INPUT:
   *   - notificationId: string (valid notification ID)
   *   - options: NotificationOptions (new options)
   * 
   * OUTPUT:
   *   - Success: boolean (true if updated)
   *   - Error: NotificationError
   * 
   * ERRORS:
   *   - InvalidNotificationId: Notification doesn't exist
   *   - InvalidOptions: Options validation failed
   *   - ChromeAPIFailure: Unexpected Chrome API error
   * 
   * PERFORMANCE: <20ms (95th percentile)
   */
  update(
    notificationId: string,
    options: NotificationOptions
  ): Promise<Result<boolean, NotificationError>>;
}

/**
 * Notification configuration options
 */
export interface NotificationOptions {
  type?: NotificationType; // default: 'basic'
  title: string; // Required - notification title (max 256 chars)
  message: string; // Required - notification body (max 512 chars)
  iconUrl?: string; // Extension icon by default
  contextMessage?: string; // Secondary text below message
  priority?: number; // -2 to 2, default 0
  eventTime?: number; // Timestamp for event
  buttons?: NotificationButton[]; // Action buttons (max 2)
  silent?: boolean; // Don't play sound
  requireInteraction?: boolean; // Stay until user dismisses
}

/**
 * Notification types supported by Chrome
 */
export type NotificationType = 'basic' | 'image' | 'list' | 'progress';

/**
 * Notification action button
 */
export interface NotificationButton {
  title: string; // Button text
  iconUrl?: string; // Button icon (optional)
}

/**
 * Notification error types
 */
export type NotificationError =
  | { type: 'PermissionDenied'; details: string }
  | { type: 'InvalidOptions'; details: string; field: string }
  | { type: 'InvalidNotificationId'; details: string; notificationId: string }
  | { type: 'ChromeAPIFailure'; details: string; originalError: unknown };

/**
 * Type guards for error handling
 */
export function isPermissionDeniedError(
  error: NotificationError
): error is Extract<NotificationError, { type: 'PermissionDenied' }> {
  return error.type === 'PermissionDenied';
}

export function isInvalidOptionsError(
  error: NotificationError
): error is Extract<NotificationError, { type: 'InvalidOptions' }> {
  return error.type === 'InvalidOptions';
}
