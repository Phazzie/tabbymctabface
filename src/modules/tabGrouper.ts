/**
 * Creates a new group with the specified tabs.
 * @param tabIds An array of tab IDs to include in the group.
 * @returns A promise that resolves with the new group's ID.
 */
export function createNewGroup(tabIds: number[]): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.tabs.group({ tabIds }, (groupId) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(groupId);
    });
  });
}
