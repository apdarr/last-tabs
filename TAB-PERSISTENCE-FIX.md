# Tab Persistence Fix - JSON Store Implementation

## Problem Identified
The `.raycast-last-tabs.json` file was showing these issues:
1. Empty `tabs` array despite active browsing
2. Presence of `excludedCurrentTab` field (no longer needed)
3. Data not being persisted in append-only way
4. Tabs being filtered out instead of showing all tabs

## Root Cause
The Chrome extension was still using the old logic that:
1. Filtered out the current/active tab from the data sent to Raycast
2. Included an `excludedCurrentTab` field in the JSON structure
3. Was not properly implementing append-only behavior

## Fixes Applied

### 1. Chrome Extension Background Script (`chrome-extension/background.js`)
**Before:**
```javascript
// Get the currently active tab to exclude it from the popup display
chrome.tabs.query({ active: true, currentWindow: true })
  .then(([activeTab]) => {
    let historyToShow = tabAccessHistory;
    if (activeTab && activeTab.url) {
      historyToShow = tabAccessHistory.filter(tab => tab.url !== activeTab.url);
    }
    sendResponse({ tabs: historyToShow });
  })
```

**After:**
```javascript
// Send ALL tabs without filtering (append-only approach)
sendResponse({ tabs: tabAccessHistory });
```

**Before:**
```javascript
sendResponse({
  tabs: historyToSend,
  lastUpdated: Date.now(),
  excludedCurrentTab: activeTab ? activeTab.url : null
});
```

**After:**
```javascript
sendResponse({
  tabs: tabAccessHistory,
  lastUpdated: Date.now()
});
```

### 2. Raycast Extension UI (`src/last-tabs.tsx`)
**Before:**
```typescript
// Filter out only the active tab, but keep ALL other tabs
const filteredTabs = tabsWithHistory
  .filter(tab => !tab.active) // Only exclude active tab
```

**After:**
```typescript
// Show ALL tabs sorted by recency (no filtering)
const sortedTabs = tabsWithHistory
  .sort((a, b) => { /* sorting logic */ })
```

### 3. Data Structure Simplified
**Before (.raycast-last-tabs.json):**
```json
{
  "tabs": [],
  "lastUpdated": 1750872167349,
  "excludedCurrentTab": "https://..."
}
```

**After (.raycast-last-tabs.json):**
```json
{
  "tabs": [
    {
      "id": 1001,
      "title": "Tab Title",
      "url": "https://...",
      "lastAccessed": 1750874070726,
      "favIconUrl": "https://...favicon.ico"
    }
  ],
  "lastUpdated": 1750874070726
}
```

## Expected Behavior After Fixes

1. **Append-Only Persistence**: When you browse to a new tab, it gets added to the `tabs` array at position 0 (most recent first)
2. **Max 50 Entries**: The array is capped at 50 entries to prevent excessive memory usage
3. **All Tabs Shown**: Both current and non-current tabs appear in the Raycast UI
4. **Proper Sorting**: Tabs are sorted by `lastAccessed` timestamp (most recent first)
5. **No Filtering**: No tabs are excluded from the persistence or display

## Testing
To verify the fix works:
1. Reload the Chrome extension (go to `chrome://extensions/` and click reload)
2. Browse to a few different tabs
3. Check `~/.raycast-last-tabs.json` - should contain actual tab entries
4. Open Raycast extension - should show all tabs sorted by recency

## Files Modified
- `chrome-extension/background.js` - Removed current tab filtering logic
- `src/last-tabs.tsx` - Removed active tab filtering in UI
- Tab history now properly append-only with max 50 entries
