// Test appending more tabs over time
const fs = require('fs');
const path = require('path');
const os = require('os');

const filePath = path.join(os.homedir(), '.raycast-last-tabs.json');

// Read existing data
let existingData = { tabs: [], lastUpdated: 0 };
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  existingData = JSON.parse(fileContent);
} catch (error) {
  console.log('No existing file, starting fresh');
}

// Add a new tab entry (simulating Chrome extension behavior)
const newTab = {
  id: Date.now(),
  title: "Stack Overflow - Tab Management Question",
  url: "https://stackoverflow.com/questions/12345/tab-management",
  lastAccessed: Date.now(),
  favIconUrl: "https://stackoverflow.com/favicon.ico"
};

// Chrome extension behavior: remove existing entry for same URL and add to beginning
existingData.tabs = existingData.tabs.filter(tab => tab.url !== newTab.url);
existingData.tabs.unshift(newTab);

// Keep max 50 tabs
if (existingData.tabs.length > 50) {
  existingData.tabs = existingData.tabs.slice(0, 50);
}

existingData.lastUpdated = Date.now();

fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
console.log('✅ Appended new tab:', newTab.title);
console.log('📊 Total tabs now:', existingData.tabs.length);
