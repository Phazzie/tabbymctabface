/**
 * FILE: MockHumorSystem.ts
 * 
 * WHAT: Mock implementation of IHumorSystem - simulates humor orchestration
 * 
 * WHY: Enables development and testing of TabManager and UI without real humor logic.
 *      Proves IHumorSystem contract is implementable. Provides test double.
 * 
 * HOW DATA FLOWS:
 *   1. TabManager/UI calls deliverQuip (SEAM-11)
 *   2. Mock simulates quip delivery
 *   3. Mock emits to notifications$ observable
 *   4. Returns fake delivery result
 * 
 * SEAMS:
 *   IN:  TabManager/UI → HumorSystem (SEAM-11)
 *   OUT: HumorSystem → notifications$ (SEAM-23 - Observable)
 * 
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import { MockObservable } from './MockObservable';
import type {
    IHumorSystem,
    HumorTrigger,
    QuipDeliveryResult,
    EasterEggMatch,
    HumorError,
    QuipNotification,
    TabEventType,
    TabEvent,
    UnsubscribeFn,
    Observable,
} from '../contracts/IHumorSystem';
import type { BrowserContext } from '../contracts/ITabManager';

/**
 * Mock implementation of IHumorSystem
 * 
 * Provides fake humor orchestration for testing and development.
 * Simulates quip delivery, easter egg checking, and event subscriptions.
 * 
 * MOCK BEHAVIOR:
 * - Returns predetermined delivery results
 * - Emits to notifications$ observable
 * - Can be configured to return null/errors
 * - Tracks call history
 * - Supports event subscriptions
 */
export class MockHumorSystem implements IHumorSystem {
    public notifications$: Observable<QuipNotification>;
    private notificationsObservable: MockObservable<QuipNotification>;
    private callHistory: MockCallRecord[] = [];
    private shouldReturnError = false;
    private shouldReturnNoQuips = false;
    private customQuipText: string | null = null;
    private eventHandlers: Map<TabEventType, ((event: TabEvent) => void)[]> = new Map();
    private nextNotificationId = 1;

    constructor() {
        this.notificationsObservable = new MockObservable<QuipNotification>();
        this.notifications$ = this.notificationsObservable;
    }

    /**
     * Deliver a quip based on trigger event
     * 
     * DATA IN: trigger: HumorTrigger
     * DATA OUT: Result<QuipDeliveryResult, HumorError>
     * 
     * SEAM: SEAM-11 (TabManager/UI → HumorSystem)
     * 
     * FLOW:
     *   1. Check if configured to return error
     *   2. Check if configured to return no quips
     *   3. Generate fake quip text
     *   4. Create delivery result
     *   5. Emit to notifications$ observable
     *   6. Return result
     * 
     * PERFORMANCE: <10ms (mock, no I/O)
     */
    async deliverQuip(
        trigger: HumorTrigger
    ): Promise<Result<QuipDeliveryResult, HumorError>> {
        this.callHistory.push({
            method: 'deliverQuip',
            args: [trigger],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'PersonalityFailure',
                details: 'Mock configured to return error',
                originalError: new Error('Mock error'),
            });
        }

        // Return no quips if configured
        if (this.shouldReturnNoQuips) {
            return Result.error({
                type: 'NoQuipsAvailable',
                details: 'No quips available for this trigger',
                triggerType: trigger.type,
            });
        }

        // Generate fake quip
        const quipText = this.customQuipText || this.getDefaultQuipForTrigger(trigger.type);
        const deliveryResult: QuipDeliveryResult = {
            delivered: true,
            quipText,
            deliveryMethod: 'chrome.notifications',
            isEasterEgg: false,
            timestamp: Date.now(),
        };

        // Emit to notifications$ observable
        const notification: QuipNotification = {
            id: `mock-notif-${this.nextNotificationId++}`,
            quipText,
            isEasterEgg: false,
            timestamp: deliveryResult.timestamp,
            displayDuration: 5000,
        };
        this.notificationsObservable.emit(notification);

        return Result.ok(deliveryResult);
    }

    /**
     * Check if current context matches any easter egg triggers
     * 
     * DATA IN: context: BrowserContext
     * DATA OUT: Result<EasterEggMatch | null, HumorError>
     * 
     * FLOW:
     *   1. Check if configured to return error
     *   2. Perform simple easter egg matching
     *   3. Return match or null
     * 
     * PERFORMANCE: <10ms (mock, simple checks)
     */
    async checkEasterEggs(
        context: BrowserContext
    ): Promise<Result<EasterEggMatch | null, HumorError>> {
        this.callHistory.push({
            method: 'checkEasterEggs',
            args: [context],
            timestamp: Date.now(),
        });

        // Simulate error if configured
        if (this.shouldReturnError) {
            return Result.error({
                type: 'EasterEggCheckFailed',
                details: 'Mock configured to return error',
            });
        }

        // Simple easter egg matching
        if (context.tabCount === 42) {
            return Result.ok({
                easterEggId: 'EE-001',
                easterEggType: '42-tabs',
                matchedConditions: ['tabCount'],
                priority: 10,
            });
        }

        if (context.tabCount >= 100) {
            return Result.ok({
                easterEggId: 'EE-003',
                easterEggType: 'tab-hoarder',
                matchedConditions: ['tabCount'],
                priority: 7,
            });
        }

        return Result.ok(null);
    }

    /**
     * Subscribe to tab events for automatic humor triggers
     * 
     * DATA IN: eventType: TabEventType, handler: (event: TabEvent) => void
     * DATA OUT: UnsubscribeFn
     * 
     * SEAM: SEAM-04, SEAM-09 (TabManager → HumorSystem events)
     * 
     * FLOW:
     *   1. Store handler in eventHandlers map
     *   2. Return unsubscribe function
     * 
     * PERFORMANCE: <1ms (synchronous)
     */
    onTabEvent(
        eventType: TabEventType,
        handler: (event: TabEvent) => void
    ): UnsubscribeFn {
        this.callHistory.push({
            method: 'onTabEvent',
            args: [eventType, handler],
            timestamp: Date.now(),
        });

        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType)!.push(handler);

        // Return unsubscribe function
        return () => {
            const handlers = this.eventHandlers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    // ========================================
    // MOCK HELPER METHODS
    // ========================================

    /**
     * Configure mock to return errors
     */
    setShouldReturnError(value: boolean): void {
        this.shouldReturnError = value;
    }

    /**
     * Configure mock to return no quips
     */
    setShouldReturnNoQuips(value: boolean): void {
        this.shouldReturnNoQuips = value;
    }

    /**
     * Set custom quip text for all deliveries
     */
    setCustomQuipText(quip: string | null): void {
        this.customQuipText = quip;
    }

    /**
     * Emit tab event to trigger handlers (for testing)
     */
    emitTabEvent(event: TabEvent): void {
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                } catch (err) {
                    console.error('MockHumorSystem: Handler threw error', err);
                }
            });
        }
    }

    /**
     * Get notification observable for direct emission (testing)
     */
    getNotificationsObservable(): MockObservable<QuipNotification> {
        return this.notificationsObservable;
    }

    /**
     * Reset mock to initial state
     */
    reset(): void {
        this.callHistory = [];
        this.shouldReturnError = false;
        this.shouldReturnNoQuips = false;
        this.customQuipText = null;
        this.eventHandlers.clear();
        this.notificationsObservable.reset();
        this.nextNotificationId = 1;
    }

    /**
     * Get call history for test assertions
     */
    getCallHistory(): MockCallRecord[] {
        return [...this.callHistory];
    }

    /**
     * Get default quip for trigger type
     */
    private getDefaultQuipForTrigger(triggerType: string): string {
        const defaultQuips: Record<string, string> = {
            'TabGroupCreated': 'Oh, another tab group. How organized of you. 🙄',
            'TabClosed': 'Another tab bites the dust. Your browser thanks you... probably.',
            'FeelingLuckyClicked': 'Feeling lucky? More like feeling reckless.',
            'TabOpened': 'A new tab! Because clearly the other tabs weren\'t enough.',
            'TooManyTabs': 'Your tab count has reached alarming levels. Should I call someone?',
            'ManualTrigger': 'You rang? Here\'s some sass for you.',
        };

        return defaultQuips[triggerType] || 'Generic passive-aggressive quip.';
    }
}

/**
 * Record of mock method calls
 */
export interface MockCallRecord {
    method: string;
    args: any[];
    timestamp: number;
}
