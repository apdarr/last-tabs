# Fix: Tab Recency Based Only on Chrome Extension Activity

## Problem Identified
The tab ranking was being influenced by **both**:
1. Chrome extension detecting when tabs become active in browser ✅ (correct)
2. Raycast extension recording when user selects tabs via Raycast ❌ (incorrect)

This caused issues where:
- Tabs you recently clicked in your browser showed "no history" if not selected via Raycast
- Rankings were skewed by Raycast usage rather than actual browser activity
- Multiple sources of truth for recency created inconsistent data

## Root Cause
Multiple places in the codebase were calling `tabHistoryManager.recordTabAccess()`:

1. **`src/last-tabs.tsx`** - When user hits Enter to select a tab
2. **`src/utils/tab-actions.ts`** - When focusing a tab via AppleScript  
3. **`src/utils/refresh-handler.ts`** - When checking active tabs

These calls overwrote the Chrome extension's timestamps with Raycast-triggered timestamps.

## Solution: Chrome Extension as Single Source of Truth

### Changes Made:

1. **Removed Raycast-side tab access recording** in `src/last-tabs.tsx`:
   ```typescript
   // BEFORE
   await tabHistoryManager.recordTabAccess(tab); // ❌ Interfered with Chrome data
   await focusOrOpenTab(tab.url, { title: tab.title, favicon: tab.favicon });
   
   // AFTER  
   await focusOrOpenTab(tab.url, { title: tab.title, favicon: tab.favicon }); // ✅ Only focus, no recording
   ```

2. **Removed access recording** in `src/utils/tab-actions.ts`:
   ```typescript
   // BEFORE
   await smartFocusTab(tab);
   await tabHistoryManager.recordTabAccess(tab); // ❌ Overwrote Chrome timestamps
   
   // AFTER
   await smartFocusTab(tab); // ✅ Only focus the tab
   ```

3. **Disabled access recording** in `src/utils/refresh-handler.ts`:
   ```typescript
   // BEFORE
   await tabHistoryManager.recordTabAccess(activeTab); // ❌ Conflicted with Chrome data
   
   // AFTER
   console.log(`ℹ️ Current active tab: ${activeTab.title}`); // ✅ Only log, no recording
   ```

## Expected Behavior After Fix

✅ **Only Chrome Extension tracks recency**: Based on when tabs become active in browser
✅ **Raycast selections don't affect ranking**: Hitting Enter in Raycast doesn't change recency
✅ **Accurate "last accessed" times**: Reflects actual browser activity, not Raycast usage
✅ **No more "no history" for recently used tabs**: All browser activity is properly tracked

## Data Flow After Fix

```
Browser Tab Activity → Chrome Extension → ~/.raycast-last-tabs.json → Raycast UI
                                                                       ↑
Raycast User Selection → Focus Tab (no timestamp changes) ───────────────┘
```

The ranking is now based purely on browser activity (tab activation) as detected by the Chrome extension, not on Raycast usage patterns.

## Files Modified
- `src/last-tabs.tsx` - Removed `recordTabAccess` from tab selection
- `src/utils/tab-actions.ts` - Removed `recordTabAccess` from tab focusing  
- `src/utils/refresh-handler.ts` - Disabled `recordTabAccess` from active tab checking
