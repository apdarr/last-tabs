// Test the corrected data format (no excludedCurrentTab)
const fs = require('fs');
const path = require('path');
const os = require('os');

const correctData = {
  tabs: [
    {
      id: 1001,
      title: "Raycast Documentation",
      url: "https://developers.raycast.com/api-reference/browser-extension",
      lastAccessed: Date.now() - 120000, // 2 minutes ago
      favIconUrl: "https://developers.raycast.com/favicon.ico"
    },
    {
      id: 1002, 
      title: "VS Code Documentation",
      url: "https://code.visualstudio.com/docs",
      lastAccessed: Date.now() - 60000, // 1 minute ago
      favIconUrl: "https://code.visualstudio.com/favicon.ico"
    },
    {
      id: 1003,
      title: "Current Tab - GitHub Issue",
      url: "https://github.com/microsoft/vscode/issues/12345",
      lastAccessed: Date.now() - 5000, // 5 seconds ago (most recent)
      favIconUrl: "https://github.com/favicon.ico"
    }
  ],
  lastUpdated: Date.now()
};

const filePath = path.join(os.homedir(), '.raycast-last-tabs.json');
fs.writeFileSync(filePath, JSON.stringify(correctData, null, 2));
console.log('✅ Correct data format written (no excludedCurrentTab)');
console.log('📊 Total tabs:', correctData.tabs.length);
console.log('🔥 Most recent tab:', correctData.tabs.find(t => t.lastAccessed === Math.max(...correctData.tabs.map(tab => tab.lastAccessed)))?.title);
