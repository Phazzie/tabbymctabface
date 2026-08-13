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
 *   3. Mock returns a fake delivery result
 * 
 * SEAMS:
 *   IN:  TabManager/UI → HumorSystem (SEAM-11)
 *   OUT: Test call history and configured Result
 * 
 * CONTRACT: IHumorSystem v1.0.0
 * GENERATED: 2025-10-13
 * CUSTOM SECTIONS: None
 */

import { Result } from '../utils/Result';
import type {
    IHumorSystem,
    HumorTrigger,
    QuipDeliveryResult,
    EasterEggMatch,
    HumorError,
} from '../contracts/IHumorSystem';
import type { BrowserContext } from '../contracts/ITabManager';

/**
 * Mock implementation of IHumorSystem
 * 
 * Provides fake humor orchestration for testing and development.
 * Simulates quip delivery and easter egg checking.
 * 
 * MOCK BEHAVIOR:
 * - Returns predetermined delivery results
 * - Can be configured to return null/errors
 * - Tracks call history
 */
export class MockHumorSystem implements IHumorSystem {
    private callHistory: MockCallRecord[] = [];
    private shouldReturnError = false;
    private shouldReturnNoQuips = false;
    private customQuipText: string | null = null;

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
     *   5. Return result
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
     * Reset mock to initial state
     */
    reset(): void {
        this.callHistory = [];
        this.shouldReturnError = false;
        this.shouldReturnNoQuips = false;
        this.customQuipText = null;
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
