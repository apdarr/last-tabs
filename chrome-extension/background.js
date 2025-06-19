// Background script for tracking tab activity
let tabAccessHistory = [];
const MAX_TABS = 50;

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Extension starting up...');
  loadTabHistory();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Extension installed/reloaded...');
  loadTabHistory();
});

// Track tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('🔄 Tab activated:', activeInfo.tabId);
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    console.log('📋 Tab details:', tab.url, tab.title);
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      console.log('✅ Valid tab, updating history');
      updateTabHistory(tab);
      
      // Force immediate save to ensure Raycast gets updated data ASAP
      console.log('🚀 Force saving immediately after tab activation');
      await saveTabHistory();
    } else {
      console.log('❌ Skipping tab (chrome:// or extension URL)');
    }
  } catch (error) {
    console.error('❌ Error getting tab info:', error);
  }
});

// Only track tab updates when they become active (not on every page load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only update if tab became active AND the URL changed
  if (changeInfo.status === 'complete' && tab.active && changeInfo.url && tab.url) {
    console.log('🔄 Active tab URL changed:', tab.url);
    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      updateTabHistory(tab);
    }
  }
});

// Handle messages from popup and external requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabHistory') {
    // Get the currently active tab to exclude it from the popup display
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(([activeTab]) => {
        let historyToShow = tabAccessHistory;
        if (activeTab && activeTab.url) {
          historyToShow = tabAccessHistory.filter(tab => tab.url !== activeTab.url);
        }
        sendResponse({ tabs: historyToShow });
      })
      .catch(() => {
        sendResponse({ tabs: tabAccessHistory });
      });
    return true; // Will respond asynchronously
  } else if (request.action === 'clearHistory') {
    tabAccessHistory = [];
    saveTabHistory();
    sendResponse({ success: true });
  }
});

function updateTabHistory(tab) {
  console.log('📝 Updating tab history for:', tab.url);
  console.log('📌 Tab pinned status:', tab.pinned);
  console.log('🔍 Tab active status:', tab.active);
  
  const now = Date.now();
  const tabInfo = {
    id: tab.id,
    title: tab.title || 'Untitled',
    url: tab.url,
    lastAccessed: now,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned || false // Track pinned status for debugging
  };

  // Remove any existing entry for this URL
  const beforeCount = tabAccessHistory.length;
  tabAccessHistory = tabAccessHistory.filter(t => t.url !== tab.url);
  const afterFilter = tabAccessHistory.length;
  
  if (beforeCount !== afterFilter) {
    console.log(`🗑️ Removed existing entry for ${tab.url}`);
  }
  
  // Add to the beginning of the array (most recent first)
  // This ensures that even pinned tabs get moved to the top when accessed
  tabAccessHistory.unshift(tabInfo);
  console.log(`➕ Added tab to position 0 with timestamp ${now}. Total tabs: ${tabAccessHistory.length}`);
  
  // Keep only the most recent MAX_TABS
  if (tabAccessHistory.length > MAX_TABS) {
    tabAccessHistory = tabAccessHistory.slice(0, MAX_TABS);
    console.log(`✂️ Trimmed to ${MAX_TABS} tabs`);
  }

  // Save to storage and file immediately - no delays for real-time updates
  console.log('💾 Saving tab history immediately...');
  saveTabHistory();
}

async function saveTabHistory() {
  try {
    console.log('💾 Starting save process...');
    // Get the currently active tab to exclude it from the history
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🎯 Current active tab:', activeTab ? activeTab.url : 'none');
    
    // Filter out the currently active tab from the history
    let historyToSend = tabAccessHistory;
    if (activeTab && activeTab.url) {
      historyToSend = tabAccessHistory.filter(tab => tab.url !== activeTab.url);
      console.log(`🔽 Filtered out active tab. Sending ${historyToSend.length} tabs (was ${tabAccessHistory.length})`);
    } else {
      console.log(`📤 Sending all ${historyToSend.length} tabs (no active tab to filter)`);
    }
    
    // Save full history to Chrome storage (including current tab)
    await chrome.storage.local.set({ tabHistory: tabAccessHistory });
    console.log('✅ Saved to Chrome storage');
    
    // Send filtered data (excluding current tab) to local server for Raycast to read
    const dataToSend = {
      tabs: historyToSend,
      lastUpdated: Date.now(),
      excludedCurrentTab: activeTab ? activeTab.url : null
    };
    
    try {
      console.log('🌐 Sending to local server...');
      const response = await fetch('http://127.0.0.1:8987/tabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        console.log('✅ Tab history sent to Raycast server successfully');
      } else {
        console.error('❌ Failed to send tab history to server:', response.status);
      }
    } catch (fetchError) {
      // Server might not be running, that's okay
      console.log('📡 Local server not available (this is normal if Raycast server is not active)');
    }
  } catch (error) {
    console.error('Error saving tab history:', error);
  }
}

async function loadTabHistory() {
  try {
    console.log('📖 Loading tab history from storage...');
    const result = await chrome.storage.local.get(['tabHistory']);
    if (result.tabHistory) {
      tabAccessHistory = result.tabHistory;
      console.log('✅ Loaded tab history:', tabAccessHistory.length, 'tabs');
      console.log('📋 Tabs loaded:', tabAccessHistory.map(t => t.url));
    } else {
      console.log('📝 No existing tab history found, starting fresh');
    }
  } catch (error) {
    console.error('❌ Error loading tab history:', error);
    tabAccessHistory = [];
  }
}

// Export data for native messaging (when requested by Raycast)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabHistory') {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(([activeTab]) => {
        let historyToSend = tabAccessHistory;
        if (activeTab && activeTab.url) {
          historyToSend = tabAccessHistory.filter(tab => tab.url !== activeTab.url);
        }
        
        sendResponse({
          tabs: historyToSend,
          lastUpdated: Date.now(),
          excludedCurrentTab: activeTab ? activeTab.url : null
        });
      })
      .catch(() => {
        sendResponse({
          tabs: tabAccessHistory,
          lastUpdated: Date.now()
        });
      });
    return true; // Will respond asynchronously
  }
});
