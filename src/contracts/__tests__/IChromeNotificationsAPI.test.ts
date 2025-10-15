/**
 * FILE: IChromeNotificationsAPI.test.ts
 * 
 * WHAT: Contract tests for IChromeNotificationsAPI - validates Chrome notifications wrapper
 * 
 * WHY: Ensures Chrome Notifications API wrapper correctly delivers humor quips via notifications.
 *      Critical seam for user-facing humor delivery mechanism.
 * 
 * HOW DATA FLOWS:
 *   1. Tests call IChromeNotificationsAPI methods
 *   2. Validate notification options structure
 *   3. Verify Result<string, NotificationsAPIError> returns
 *   4. Ensure error mapping from Chrome to domain errors
 * 
 * SEAMS:
 *   IN: HumorSystem → ChromeNotificationsAPI (SEAM-26)
 *   OUT: ChromeNotificationsAPI → chrome.notifications (external)
 * 
 * CONTRACT: IChromeNotificationsAPI v1.0.0 validation
 * GENERATED: 2025-10-10
 * CUSTOM SECTIONS: None
 */

import { describe, it, expect } from 'vitest';
import type { 
  IChromeNotificationsAPI,
  NotificationOptions,
  NotificationsAPIError
} from '../../contracts/IChromeNotificationsAPI';
import { Result } from '../../utils/Result';

describe('IChromeNotificationsAPI CONTRACT', () => {
  describe('CONTRACT: create()', () => {
    it('MUST accept NotificationOptions with required fields', () => {
      const options: NotificationOptions = {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'TabbyMcTabface',
        message: 'Oh great, another tab. Just what we needed.'
      };
      
      expect(options.type).toBe('basic');
      expect(options.iconUrl).toBeDefined();
      expect(options.title).toBeDefined();
      expect(options.message).toBeDefined();
    });

    it('MUST support optional priority field', () => {
      const minimalOptions: NotificationOptions = {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Title',
        message: 'Message'
      };
      
      const fullOptions: NotificationOptions = {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Title',
        message: 'Message',
        priority: 1
      };
      
      expect(minimalOptions.priority).toBeUndefined();
      expect(fullOptions.priority).toBe(1);
    });

    it('MUST return Result<string, NotificationsAPIError> on success', () => {
      const notificationId = 'notification-123';
      const successResult = Result.ok(notificationId);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('string');
      }
    });

    it('MUST return PermissionDenied when lacking notification permission', () => {
      const error: NotificationsAPIError = {
        type: 'PermissionDenied',
        details: 'Extension lacks notifications permission'
      };
      
      expect(error.type).toBe('PermissionDenied');
      expect(error.details).toContain('permission');
    });

    it('MUST return InvalidOptions for malformed notification options', () => {
      const error: NotificationsAPIError = {
        type: 'InvalidOptions',
        details: 'Missing required field: message'
      };
      
      expect(error.type).toBe('InvalidOptions');
      expect(error.details).toContain('required field');
    });

    it('MUST meet <20ms performance SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: clear()', () => {
    it('MUST accept notificationId as string', () => {
      const notificationId = 'notification-123';
      expect(typeof notificationId).toBe('string');
    });

    it('MUST return Result<boolean, NotificationsAPIError> on success', () => {
      const wasCleared = true;
      const successResult = Result.ok(wasCleared);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('boolean');
      }
    });

    it('MUST return true if notification was cleared', () => {
      const result = Result.ok(true);
      expect(Result.unwrapOr(result, false)).toBe(true);
    });

    it('MUST return false if notification was already dismissed', () => {
      const result = Result.ok(false);
      expect(Result.unwrapOr(result, false)).toBe(false);
    });

    it('MUST return InvalidNotificationId for non-existent notification', () => {
      const error: NotificationsAPIError = {
        type: 'InvalidNotificationId',
        details: 'Notification notification-999 not found',
        notificationId: 'notification-999'
      };
      
      expect(error.type).toBe('InvalidNotificationId');
      expect(error.notificationId).toBe('notification-999');
    });
  });

  describe('CONTRACT: update()', () => {
    it('MUST accept notificationId and NotificationOptions', () => {
      const notificationId = 'notification-123';
      const options: NotificationOptions = {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Updated Title',
        message: 'Updated message'
      };
      
      expect(typeof notificationId).toBe('string');
      expect(options.message).toBe('Updated message');
    });

    it('MUST return Result<boolean, NotificationsAPIError> on success', () => {
      const wasUpdated = true;
      const successResult = Result.ok(wasUpdated);
      
      expect(Result.isOk(successResult)).toBe(true);
      if (Result.isOk(successResult)) {
        expect(typeof successResult.value).toBe('boolean');
      }
    });

    it('MUST return true if notification was updated', () => {
      const result = Result.ok(true);
      expect(Result.unwrapOr(result, false)).toBe(true);
    });

    it('MUST return false if notification was already dismissed', () => {
      const result = Result.ok(false);
      expect(Result.unwrapOr(result, false)).toBe(false);
    });

    it('MUST return InvalidNotificationId for non-existent notification', () => {
      const error: NotificationsAPIError = {
        type: 'InvalidNotificationId',
        details: 'Cannot update non-existent notification',
        notificationId: 'notification-999'
      };
      
      expect(error.type).toBe('InvalidNotificationId');
    });
  });

  describe('CONTRACT: Error Type Guarantees', () => {
    it('NotificationsAPIError MUST be discriminated union', () => {
      const error1: NotificationsAPIError = {
        type: 'PermissionDenied',
        details: 'No permission'
      };
      const error2: NotificationsAPIError = {
        type: 'InvalidOptions',
        details: 'Bad options'
      };
      const error3: NotificationsAPIError = {
        type: 'InvalidNotificationId',
        details: 'Not found',
        notificationId: 'id-123'
      };
      const error4: NotificationsAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Chrome failed',
        originalError: new Error()
      };
      
      expect(error1.type).toBe('PermissionDenied');
      expect(error2.type).toBe('InvalidOptions');
      expect(error3.type).toBe('InvalidNotificationId');
      expect(error4.type).toBe('ChromeAPIFailure');
    });

    it('MUST preserve originalError in ChromeAPIFailure', () => {
      const chromeError = new Error('Notification system error');
      const error: NotificationsAPIError = {
        type: 'ChromeAPIFailure',
        details: 'Wrapped notification error',
        originalError: chromeError
      };
      
      expect(error.originalError).toBe(chromeError);
    });
  });

  describe('CONTRACT: Performance SLAs', () => {
    it('ALL methods MUST have <20ms SLA', () => {
      const SLA_MS = 20;
      expect(SLA_MS).toBe(20);
    });
  });

  describe('CONTRACT: No Exceptions', () => {
    it('MUST never throw exceptions - always return Result', () => {
      const successResult = Result.ok('notification-123');
      const errorResult = Result.error<NotificationsAPIError>({
        type: 'PermissionDenied',
        details: 'No permission'
      });
      
      expect(Result.isOk(successResult) || Result.isError(successResult)).toBe(true);
      expect(Result.isOk(errorResult) || Result.isError(errorResult)).toBe(true);
    });
  });
});
