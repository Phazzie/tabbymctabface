document.addEventListener('DOMContentLoaded', () => {
  const quipElement = document.getElementById('quip');
  const createGroupBtn = document.getElementById('create-group-btn');

  if (!quipElement || !createGroupBtn) {
    console.error('Popup UI elements not found');
    return;
  }

  // --- Get Commentary ---
  chrome.runtime.sendMessage({ action: 'getCurrentCommentary' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      quipElement.textContent = 'Error fetching commentary.';
    } else if (response) {
      quipElement.textContent = response;
    } else {
      quipElement.textContent = 'No commentary available at the moment.';
    }
  });

  // --- Handle Create Group ---
  createGroupBtn.addEventListener('click', async () => {
    try {
      // Get all tabs in the current window that are not already in a group
      const tabsToGroup = await chrome.tabs.query({ currentWindow: true, noGroup: true });
      const tabIds = tabsToGroup.map(({ id }) => id).filter((id): id is number => id !== undefined);

      if (tabIds.length > 0) {
        const response = await chrome.runtime.sendMessage({ action: 'createNewGroup', tabIds });
        if (response?.success) {
          console.log(`Group created with ID: ${response.groupId}`);
          // Maybe provide user feedback here, like a temporary success message.
          quipElement.textContent = 'Group created!';
          setTimeout(() => window.close(), 1000);
        } else {
          throw new Error(response?.error || 'Failed to create group.');
        }
      } else {
        quipElement.textContent = 'No tabs to group.';
      }
    } catch (error) {
      console.error('Error creating group:', error);
      quipElement.textContent = 'Could not create group.';
    }
  });
});
