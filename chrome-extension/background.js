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

// Track new tab creation (links from Slack, email, right-click "Open in new tab", etc.)
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('🆕 New tab created:', tab.id, tab.url);
  
  // New tabs might not have a URL yet, so we wait for onUpdated to handle them
  if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    console.log('✅ New tab has valid URL, updating history immediately');
    updateTabHistory(tab);
    await saveTabHistory();
  } else {
    console.log('⏳ New tab has no URL yet or invalid URL, will track when URL loads');
  }
});

// Track tab updates (URL changes, page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Handle several scenarios:
  // 1. New tab gets a URL for the first time (status: 'complete', url changed)
  // 2. Active tab navigates to new URL (status: 'complete', url changed, tab.active)
  // 3. Any tab finishes loading (status: 'complete')
  
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    console.log('🔄 Tab updated:', tabId, 'URL:', tab.url, 'Active:', tab.active);
    
    // Only track if:
    // - Tab is currently active (user navigated)
    // - OR the URL changed (new tab got its URL, or navigation happened)
    if (tab.active || changeInfo.url) {
      console.log('✅ Tab update qualifies for tracking');
      updateTabHistory(tab);
      await saveTabHistory();
    } else {
      console.log('⏭️ Tab update does not qualify for tracking (not active, no URL change)');
    }
  }
});

// Handle messages from popup and external requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabHistory') {
    // Send ALL tabs without filtering (append-only approach)
    sendResponse({ tabs: tabAccessHistory });
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
    
    // Save full history to Chrome storage
    await chrome.storage.local.set({ tabHistory: tabAccessHistory });
    console.log('✅ Saved to Chrome storage');
    
    // Send ONLY recency updates to Raycast (don't overwrite entire file)
    const recencyUpdates = {
      tabUpdates: tabAccessHistory.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        lastAccessed: tab.lastAccessed,
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned
      })),
      timestamp: Date.now()
    };
    
    try {
      console.log(`🌐 Sending recency updates for ${tabAccessHistory.length} tabs to local server...`);
      const response = await fetch('http://127.0.0.1:8987/update-recency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recencyUpdates)
      });
      
      if (response.ok) {
        console.log('✅ Recency updates sent to Raycast server successfully');
      } else {
        console.error('❌ Failed to send recency updates to server:', response.status);
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
    // Send ALL tabs without filtering (append-only approach)
    sendResponse({
      tabs: tabAccessHistory,
      lastUpdated: Date.now()
    });
    return true; // Will respond asynchronously
  }
});
