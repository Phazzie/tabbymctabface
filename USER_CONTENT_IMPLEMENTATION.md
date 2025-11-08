# 🎨 User-Created Content Implementation Guide

**Date**: November 2025
**Purpose**: Complete implementation guide for user-created quips feature

---

## 🎯 Feature Overview

**What**: Allow premium users to create custom passive-aggressive quips
**Why**: Sticky premium feature that increases retention and personalization
**Tier Requirement**: Premium or Lifetime only (not free)

### User Experience

```
User Flow:
1. User clicks "Create Custom Quip" button (premium feature)
2. UI shows create form:
   - Text input (10-200 chars)
   - Trigger type dropdown
   - Humor level selector
   - Preview button
3. User enters quip and clicks "Save"
4. Extension validates and stores quip
5. Custom quip appears in rotation immediately
6. User can edit/delete their quips anytime
```

---

## 🏗️ Architecture

### Data Structure

**UserQuipData** extends QuipData with ownership:
```typescript
export interface UserQuipData extends QuipData {
  id: string;              // "USER-{timestamp}"
  text: string;            // User's quip text
  triggerTypes: string[];  // Selected triggers
  level: HumorLevel;       // Humor intensity
  tier: 'free';            // User quips always accessible to creator
  metadata: {
    tags: ['user-created'];
    createdAt: number;     // Timestamp
    updatedAt?: number;    // Last edit timestamp
    author: 'user';        // vs 'official'
  };
}
```

### Storage Strategy

**Option A: Chrome Storage Sync** (RECOMMENDED)
- Store in `chrome.storage.sync` (up to 100KB)
- Automatically syncs across user's devices
- Max ~300 quips (at ~300 bytes each)

**Option B: Chrome Storage Local**
- Store in `chrome.storage.local` (unlimited)
- No automatic sync
- Better for large collections

**Recommendation**: Use `sync` for premium feature value (cross-device sync)

---

## 📝 Implementation Steps

### Step 1: Extend QuipStorage Interface

```typescript
// src/contracts/IQuipStorage.ts

export interface IQuipStorage {
  // ... existing methods ...

  /**
   * Add user-created quip
   *
   * INPUT:
   *   - text: string (10-200 chars)
   *   - triggerTypes: string[]
   *   - level: HumorLevel
   *
   * OUTPUT:
   *   - Success: UserQuipData (newly created quip)
   *   - Error: StorageError
   *
   * ERRORS:
   *   - ValidationError: Text too short/long, invalid triggers
   *   - PremiumRequired: User is on free tier
   *   - QuotaExceeded: User has reached max custom quips (100)
   *
   * @param text - Quip text
   * @param triggerTypes - Trigger types
   * @param level - Humor level
   * @returns Promise resolving to created quip
   */
  addUserQuip(
    text: string,
    triggerTypes: string[],
    level: HumorLevel
  ): Promise<Result<UserQuipData, StorageError>>;

  /**
   * Update user-created quip
   *
   * INPUT:
   *   - quipId: string (USER-{timestamp})
   *   - updates: Partial<UserQuipData>
   *
   * OUTPUT:
   *   - Success: UserQuipData (updated quip)
   *   - Error: StorageError
   *
   * ERRORS:
   *   - QuipNotFound: ID doesn't exist
   *   - PermissionDenied: Can't edit official quips
   *
   * @param quipId - Quip ID to update
   * @param updates - Fields to update
   * @returns Promise resolving to updated quip
   */
  updateUserQuip(
    quipId: string,
    updates: Partial<Pick<UserQuipData, 'text' | 'triggerTypes' | 'level'>>
  ): Promise<Result<UserQuipData, StorageError>>;

  /**
   * Delete user-created quip
   *
   * INPUT:
   *   - quipId: string (USER-{timestamp})
   *
   * OUTPUT:
   *   - Success: void
   *   - Error: StorageError
   *
   * @param quipId - Quip ID to delete
   * @returns Promise resolving to success or error
   */
  deleteUserQuip(quipId: string): Promise<Result<void, StorageError>>;

  /**
   * Get all user-created quips
   *
   * INPUT: void
   *
   * OUTPUT:
   *   - Success: UserQuipData[]
   *   - Error: StorageError
   *
   * @returns Promise resolving to user quips array
   */
  getUserQuips(): Promise<Result<UserQuipData[], StorageError>>;
}

// Add new error types
export type StorageError =
  | { type: 'NotInitialized'; details: string }
  | { type: 'ValidationError'; details: string; field: string }
  | { type: 'PremiumRequired'; details: string }
  | { type: 'QuotaExceeded'; details: string; currentCount: number; maxCount: number }
  | { type: 'QuipNotFound'; details: string; quipId: string }
  | { type: 'PermissionDenied'; details: string }
  // ... existing error types
```

---

### Step 2: Implement User Quip Methods in QuipStorage

```typescript
// src/impl/QuipStorage.ts

export class QuipStorage implements IQuipStorage {
  // ... existing fields ...
  private userCreatedQuips: UserQuipData[] = [];
  private static readonly USER_QUIPS_KEY = 'tabby_user_quips';
  private static readonly MAX_USER_QUIPS = 100;

  async initialize(): Promise<Result<void, StorageError>> {
    // ... existing initialization ...

    // Load user quips from storage
    await this.loadUserQuips();

    return Result.ok(undefined);
  }

  /**
   * Add user-created quip
   */
  async addUserQuip(
    text: string,
    triggerTypes: string[],
    level: HumorLevel
  ): Promise<Result<UserQuipData, StorageError>> {
    // 1. Check premium access
    const tierResult = await this.accessControl.getUserTier();
    if (!tierResult.ok || tierResult.value === 'free') {
      return Result.error({
        type: 'PremiumRequired',
        details: 'Custom quips require premium subscription'
      });
    }

    // 2. Validate text length
    if (!text || text.trim().length < 10) {
      return Result.error({
        type: 'ValidationError',
        details: 'Quip must be at least 10 characters',
        field: 'text'
      });
    }

    if (text.length > 200) {
      return Result.error({
        type: 'ValidationError',
        details: 'Quip must be 200 characters or less',
        field: 'text'
      });
    }

    // 3. Validate trigger types
    if (!triggerTypes || triggerTypes.length === 0) {
      return Result.error({
        type: 'ValidationError',
        details: 'At least one trigger type required',
        field: 'triggerTypes'
      });
    }

    // 4. Check quota
    if (this.userCreatedQuips.length >= QuipStorage.MAX_USER_QUIPS) {
      return Result.error({
        type: 'QuotaExceeded',
        details: `Maximum ${QuipStorage.MAX_USER_QUIPS} custom quips allowed`,
        currentCount: this.userCreatedQuips.length,
        maxCount: QuipStorage.MAX_USER_QUIPS
      });
    }

    // 5. Create quip
    const quip: UserQuipData = {
      id: `USER-${Date.now()}`,
      text: text.trim(),
      triggerTypes,
      level,
      tier: 'free', // User quips always accessible to creator
      metadata: {
        tags: ['user-created'],
        createdAt: Date.now(),
        author: 'user'
      }
    };

    // 6. Store
    this.userCreatedQuips.push(quip);
    await this.saveUserQuips();

    return Result.ok(quip);
  }

  /**
   * Update user-created quip
   */
  async updateUserQuip(
    quipId: string,
    updates: Partial<Pick<UserQuipData, 'text' | 'triggerTypes' | 'level'>>
  ): Promise<Result<UserQuipData, StorageError>> {
    // 1. Find quip
    const index = this.userCreatedQuips.findIndex(q => q.id === quipId);
    if (index === -1) {
      return Result.error({
        type: 'QuipNotFound',
        details: `Quip with ID ${quipId} not found`,
        quipId
      });
    }

    // 2. Check if it's a user quip
    if (!quipId.startsWith('USER-')) {
      return Result.error({
        type: 'PermissionDenied',
        details: 'Cannot edit official quips'
      });
    }

    // 3. Validate updates
    if (updates.text !== undefined) {
      if (updates.text.trim().length < 10) {
        return Result.error({
          type: 'ValidationError',
          details: 'Quip must be at least 10 characters',
          field: 'text'
        });
      }
      if (updates.text.length > 200) {
        return Result.error({
          type: 'ValidationError',
          details: 'Quip must be 200 characters or less',
          field: 'text'
        });
      }
    }

    // 4. Apply updates
    const quip = this.userCreatedQuips[index];
    const updated: UserQuipData = {
      ...quip,
      ...updates,
      metadata: {
        ...quip.metadata,
        updatedAt: Date.now()
      }
    };

    this.userCreatedQuips[index] = updated;
    await this.saveUserQuips();

    return Result.ok(updated);
  }

  /**
   * Delete user-created quip
   */
  async deleteUserQuip(quipId: string): Promise<Result<void, StorageError>> {
    // 1. Find quip
    const index = this.userCreatedQuips.findIndex(q => q.id === quipId);
    if (index === -1) {
      return Result.error({
        type: 'QuipNotFound',
        details: `Quip with ID ${quipId} not found`,
        quipId
      });
    }

    // 2. Delete
    this.userCreatedQuips.splice(index, 1);
    await this.saveUserQuips();

    return Result.ok(undefined);
  }

  /**
   * Get all user-created quips
   */
  async getUserQuips(): Promise<Result<UserQuipData[], StorageError>> {
    return Result.ok([...this.userCreatedQuips]);
  }

  /**
   * Load user quips from storage
   */
  private async loadUserQuips(): Promise<Result<void, StorageError>> {
    try {
      const result = await this.storageAPI.get(QuipStorage.USER_QUIPS_KEY);
      if (!result.ok) {
        // No user quips yet
        this.userCreatedQuips = [];
        return Result.ok(undefined);
      }

      const quips = result.value[QuipStorage.USER_QUIPS_KEY];
      if (Array.isArray(quips)) {
        this.userCreatedQuips = quips;
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.error({
        type: 'JSONParseError',
        details: 'Failed to load user quips',
        filePath: 'chrome.storage.sync',
        originalError: error
      });
    }
  }

  /**
   * Save user quips to storage
   */
  private async saveUserQuips(): Promise<Result<void, StorageError>> {
    try {
      await this.storageAPI.set({
        [QuipStorage.USER_QUIPS_KEY]: this.userCreatedQuips
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error({
        type: 'JSONParseError',
        details: 'Failed to save user quips',
        filePath: 'chrome.storage.sync',
        originalError: error
      });
    }
  }

  /**
   * Update getPassiveAggressiveQuips to include user quips
   */
  async getPassiveAggressiveQuips(
    level: HumorLevel,
    triggerType?: string
  ): Promise<Result<QuipData[], StorageError>> {
    // ... existing code ...

    // Merge official + user quips
    const allQuips = [
      ...filteredQuips,
      ...this.userCreatedQuips.filter(uq => uq.level === level)
    ];

    // Filter by trigger type
    let finalQuips = allQuips;
    if (triggerType) {
      finalQuips = allQuips.filter(quip =>
        quip.triggerTypes.includes(triggerType)
      );
    }

    // Filter by tier (user quips are already accessible to creator)
    const tierResult = await this.accessControl.getUserTier();
    if (tierResult.ok) {
      finalQuips = filterQuipsByTier(finalQuips, tierResult.value);
    }

    return Result.ok(finalQuips);
  }
}
```

---

### Step 3: Add UI for Creating Quips

```html
<!-- popup.html -->

<!-- Premium Feature Section -->
<section id="custom-quips-section" class="premium-feature">
  <h2>✨ Custom Quips</h2>
  <p class="feature-description">
    Create your own passive-aggressive quips!
    <span class="premium-badge">Premium Feature</span>
  </p>

  <!-- Create Form -->
  <div id="create-quip-form" class="quip-form">
    <div class="form-group">
      <label for="quip-text">Your Quip (10-200 characters)</label>
      <textarea
        id="quip-text"
        class="quip-input"
        placeholder="Your passive-aggressive masterpiece..."
        maxlength="200"
        rows="3"
      ></textarea>
      <span class="char-count">0/200</span>
    </div>

    <div class="form-group">
      <label for="quip-trigger">When should this show?</label>
      <select id="quip-trigger" class="quip-select">
        <option value="TabGroupCreated">Tab Group Created</option>
        <option value="FeelingLuckyClicked">Feeling Lucky Clicked</option>
      </select>
    </div>

    <div class="form-group">
      <label for="quip-level">Intensity Level</label>
      <select id="quip-level" class="quip-select">
        <option value="default">Default (Supportive Skepticism)</option>
        <option value="mild">Mild (Slightly More Snarky)</option>
        <option value="intense">Intense (Maximum Snark)</option>
      </select>
    </div>

    <div class="form-actions">
      <button id="save-quip-btn" class="btn btn-primary">
        💾 Save Quip
      </button>
      <button id="cancel-quip-btn" class="btn btn-secondary">
        Cancel
      </button>
    </div>
  </div>

  <!-- User Quips List -->
  <div id="user-quips-list">
    <h3>Your Quips (<span id="quip-count">0</span>/100)</h3>
    <div id="quips-container">
      <!-- Dynamically populated -->
    </div>
  </div>
</section>
```

```css
/* popup.css */

.premium-feature {
  border: 2px solid var(--color-premium, #7b68ee);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: linear-gradient(135deg, rgba(123, 104, 238, 0.1), rgba(74, 144, 226, 0.1));
}

.premium-badge {
  background: var(--color-premium, #7b68ee);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-left: 8px;
}

.quip-form {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.quip-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
}

.quip-input:focus {
  outline: none;
  border-color: var(--color-primary, #4a90e2);
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.quip-select {
  width: 100%;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.quip-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.quip-card-text {
  font-style: italic;
  margin-bottom: 8px;
}

.quip-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
  color: #666;
}

.quip-card-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}
```

```typescript
// popup.ts

// Custom Quips Management
document.addEventListener('DOMContentLoaded', async () => {
  const context = await initializeExtension();
  if (!context.ok) return;

  const quipStorage = context.value.quipStorage;
  const accessControl = context.value.accessControl;

  // Check if user has premium access
  const tierResult = await accessControl.getUserTier();
  const isPremium = tierResult.ok && tierResult.value !== 'free';

  if (!isPremium) {
    // Hide custom quips section or show upgrade prompt
    document.getElementById('custom-quips-section')?.classList.add('locked');
    return;
  }

  // Character count for textarea
  const quipTextarea = document.getElementById('quip-text') as HTMLTextAreaElement;
  const charCount = document.querySelector('.char-count');

  quipTextarea?.addEventListener('input', () => {
    const length = quipTextarea.value.length;
    if (charCount) {
      charCount.textContent = `${length}/200`;
      charCount.style.color = length < 10 ? 'red' : length > 180 ? 'orange' : '#666';
    }
  });

  // Save quip button
  document.getElementById('save-quip-btn')?.addEventListener('click', async () => {
    const text = quipTextarea?.value;
    const trigger = (document.getElementById('quip-trigger') as HTMLSelectElement)?.value;
    const level = (document.getElementById('quip-level') as HTMLSelectElement)?.value as HumorLevel;

    if (!text || !trigger || !level) {
      alert('Please fill in all fields');
      return;
    }

    const result = await quipStorage.addUserQuip(text, [trigger], level);

    if (result.ok) {
      alert('✅ Quip saved successfully!');
      quipTextarea.value = '';
      if (charCount) charCount.textContent = '0/200';
      await loadUserQuips();
    } else {
      if (result.error.type === 'ValidationError') {
        alert(`❌ ${result.error.details}`);
      } else if (result.error.type === 'QuotaExceeded') {
        alert(`❌ ${result.error.details}`);
      } else {
        alert('❌ Failed to save quip. Please try again.');
      }
    }
  });

  // Load and display user quips
  async function loadUserQuips() {
    const result = await quipStorage.getUserQuips();
    if (!result.ok) return;

    const quips = result.value;
    const container = document.getElementById('quips-container');
    const countSpan = document.getElementById('quip-count');

    if (countSpan) countSpan.textContent = quips.length.toString();

    if (!container) return;

    if (quips.length === 0) {
      container.innerHTML = '<p class="empty-state">No custom quips yet. Create your first one!</p>';
      return;
    }

    container.innerHTML = quips.map(quip => `
      <div class="quip-card" data-quip-id="${quip.id}">
        <div class="quip-card-text">"${quip.text}"</div>
        <div class="quip-card-meta">
          <span>Trigger: ${quip.triggerTypes.join(', ')}</span>
          <div class="quip-card-actions">
            <button class="btn-icon edit-quip" data-quip-id="${quip.id}" title="Edit">✏️</button>
            <button class="btn-icon delete-quip" data-quip-id="${quip.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners for edit/delete
    container.querySelectorAll('.delete-quip').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const quipId = (e.target as HTMLElement).dataset.quipId;
        if (!quipId) return;

        if (confirm('Delete this quip?')) {
          const result = await quipStorage.deleteUserQuip(quipId);
          if (result.ok) {
            await loadUserQuips();
          } else {
            alert('Failed to delete quip');
          }
        }
      });
    });
  }

  // Initial load
  await loadUserQuips();
});
```

---

## 🔒 Premium Gating

```typescript
// Ensure feature is only available to premium users

async function checkPremiumAccess(): Promise<boolean> {
  const tierResult = await accessControl.getUserTier();
  return tierResult.ok && tierResult.value !== 'free';
}

// In UI code
if (await checkPremiumAccess()) {
  // Show custom quips section
  document.getElementById('custom-quips-section')?.classList.remove('locked');
} else {
  // Show upgrade prompt
  document.getElementById('custom-quips-section')?.innerHTML = `
    <div class="upgrade-prompt">
      <h3>🔒 Custom Quips</h3>
      <p>Create unlimited custom quips with Premium!</p>
      <button id="upgrade-btn">Upgrade to Premium - $2.99/mo</button>
    </div>
  `;
}
```

---

## 💾 Cloud Sync

**Automatic with `chrome.storage.sync`**:
- User creates quip on laptop → syncs to desktop automatically
- Max 100KB total (plenty for 300+ quips)
- No backend needed

---

## 🧪 Testing

```typescript
// Test user quip creation
describe('User Quip Creation', () => {
  it('should create quip for premium user', async () => {
    // Set user as premium
    await accessControl.activateLicense('TABBY-TEST-1234-5678-90AB');

    const result = await quipStorage.addUserQuip(
      'Your tab management skills are questionable at best.',
      ['TabGroupCreated'],
      'default'
    );

    expect(result.ok).toBe(true);
    expect(result.value.text).toBe('Your tab management skills are questionable at best.');
  });

  it('should reject quip for free user', async () => {
    const result = await quipStorage.addUserQuip(
      'Test quip',
      ['TabGroupCreated'],
      'default'
    );

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('PremiumRequired');
  });

  it('should enforce max quota', async () => {
    // Create 100 quips
    for (let i = 0; i < 100; i++) {
      await quipStorage.addUserQuip(`Quip ${i}`, ['TabGroupCreated'], 'default');
    }

    // 101st should fail
    const result = await quipStorage.addUserQuip(
      'One too many',
      ['TabGroupCreated'],
      'default'
    );

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('QuotaExceeded');
  });
});
```

---

## 🎯 Summary

### Effort Estimate: 8 hours
- IQuipStorage interface updates: 1 hour
- QuipStorage implementation: 3 hours
- UI (HTML/CSS/TypeScript): 3 hours
- Testing: 1 hour

### Premium Value Proposition
- **Stickiness**: Users invest time creating quips = less likely to churn
- **Personalization**: Unique to each user
- **Shareability**: Users can export/share quip collections (future feature)

### Next Steps
1. Implement storage methods (Step 2)
2. Build UI (Step 3)
3. Test with real users
4. Iterate based on feedback

---

**User-created content is one of the highest-retention premium features. Worth the investment!**
