interface TabData {
  [tabId: number]: {
    startTime: number;
    lastActiveTime: number;
  };
}

// Manages the state of tab data to prevent race conditions.
class TabDataManager {
  private tabData: TabData = {};

  constructor() {
    this.loadData();
  }

  async loadData(): Promise<void> {
    const result = await chrome.storage.local.get('tabData');
    this.tabData = result.tabData || {};
  }

  private async saveData(): Promise<void> {
    await chrome.storage.local.set({ tabData: this.tabData });
  }

  public get(tabId: number) {
    return this.tabData[tabId];
  }

  public set(tabId: number, data: { startTime: number; lastActiveTime: number }) {
    this.tabData[tabId] = data;
    this.saveData();
  }

  public remove(tabId: number) {
    delete this.tabData[tabId];
    this.saveData();
  }
}

const tabDataManager = new TabDataManager();

/**
 * Starts tracking time for a given tab.
 * @param tabId The ID of the tab to track.
 */
export function startTracking(tabId: number): void {
  const now = Date.now();
  tabDataManager.set(tabId, { startTime: now, lastActiveTime: now });
}

/**
 * Stops tracking time for a given tab, updating its last active time.
 * @param tabId The ID of the tab to stop tracking.
 */
export function stopTracking(tabId: number): void {
  const tabInfo = tabDataManager.get(tabId);
  if (tabInfo) {
    tabDataManager.set(tabId, {
      ...tabInfo,
      lastActiveTime: Date.now(),
    });
  }
}

/**
 * Calculates the total elapsed time a tab has been tracked.
 * @param tabId The ID of the tab.
 * @returns A promise that resolves with the elapsed time in milliseconds.
 */
export function getElapsedTime(tabId: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tabInfo = tabDataManager.get(tabId);
    if (tabInfo) {
      const elapsedTime = tabInfo.lastActiveTime - tabInfo.startTime;
      resolve(elapsedTime);
    } else {
      reject(new Error(`Time tracking data not found for tab ${tabId}`));
    }
  });
}

/**
 * Removes tracking data for a closed tab.
 * @param tabId The ID of the closed tab.
 */
export function cleanupTab(tabId: number): void {
  tabDataManager.remove(tabId);
}
