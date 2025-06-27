// Test script to verify tab history manager can read the corrected data format
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_EXTENSION_DATA_PATH = path.join(os.homedir(), '.raycast-last-tabs.json');

try {
  const chromeData = fs.readFileSync(CHROME_EXTENSION_DATA_PATH, 'utf8');
  const parsed = JSON.parse(chromeData);
  
  console.log('✅ Successfully parsed Chrome extension data');
  console.log('📊 Data structure:');
  console.log(`  - tabs: ${Array.isArray(parsed.tabs) ? parsed.tabs.length : 'NOT_ARRAY'}`);
  console.log(`  - lastUpdated: ${parsed.lastUpdated ? 'PRESENT' : 'MISSING'}`);
  console.log(`  - excludedCurrentTab: ${parsed.excludedCurrentTab ? 'PRESENT (BAD)' : 'MISSING (GOOD)'}`);
  
  if (parsed.tabs && Array.isArray(parsed.tabs)) {
    console.log('\n📋 Tab entries:');
    parsed.tabs.forEach((tab, index) => {
      console.log(`  ${index + 1}. ${tab.title || 'NO_TITLE'}`);
      console.log(`     URL: ${tab.url || 'NO_URL'}`);
      console.log(`     Last accessed: ${tab.lastAccessed ? new Date(tab.lastAccessed).toLocaleString() : 'NO_TIMESTAMP'}`);
      console.log('');
    });
    
    // Verify the expected data structure matches ChromeExtensionTab interface
    const firstTab = parsed.tabs[0];
    if (firstTab) {
      const hasRequiredFields = firstTab.id && firstTab.title && firstTab.url && firstTab.lastAccessed;
      console.log(`🔍 First tab has required fields: ${hasRequiredFields ? 'YES' : 'NO'}`);
    }
  }
  
} catch (error) {
  console.error('❌ Error reading Chrome extension data:', error.message);
}
