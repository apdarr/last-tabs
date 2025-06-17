// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const tabList = document.getElementById('tabList');
  const status = document.getElementById('status');
  const clearBtn = document.getElementById('clearBtn');

  // Load and display tab history
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTabHistory' });
    const tabs = response.tabs || [];
    
    status.textContent = `${tabs.length} tabs tracked`;
    
    if (tabs.length === 0) {
      tabList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No tabs tracked yet</div>';
    } else {
      tabList.innerHTML = tabs.map((tab, index) => `
        <div class="tab-item">
          <div class="tab-title">${escapeHtml(tab.title)}</div>
          <div class="tab-url">${escapeHtml(tab.url)}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading tabs:', error);
    status.textContent = 'Error loading tabs';
  }

  // Clear history button
  clearBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      tabList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">History cleared</div>';
      status.textContent = '0 tabs tracked';
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  });
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
