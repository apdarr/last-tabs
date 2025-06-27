// Simple test to simulate Chrome extension sending tab data
const fs = require('fs');
const path = require('path');
const os = require('os');

const testData = {
  tabs: [
    {
      id: 1,
      title: "GitHub - Tab Management",
      url: "https://github.com/test/tab-management",
      lastAccessed: Date.now() - 300000, // 5 minutes ago
      favIconUrl: "https://github.com/favicon.ico"
    },
    {
      id: 2,
      title: "Google Calendar",
      url: "https://calendar.google.com/calendar/u/0/r/week",
      lastAccessed: Date.now() - 60000, // 1 minute ago
      favIconUrl: "https://calendar.google.com/favicon.ico"
    },
    {
      id: 3,
      title: "Raycast Docs",
      url: "https://developers.raycast.com/api-reference/browser-extension",
      lastAccessed: Date.now() - 10000, // 10 seconds ago
      favIconUrl: "https://developers.raycast.com/favicon.ico"
    }
  ],
  lastUpdated: Date.now()
};

const filePath = path.join(os.homedir(), '.raycast-last-tabs.json');
fs.writeFileSync(filePath, JSON.stringify(testData, null, 2));
console.log('✅ Test data written to', filePath);
console.log('📋 Data:', JSON.stringify(testData, null, 2));
