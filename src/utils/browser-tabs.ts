import { BrowserExtension } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  windowIndex?: number;
  tabIndex?: number;
  active?: boolean;
}

export interface TabWithHistory extends Tab {
  lastAccessed: number;
  accessCount: number;
}

// Get all browser tabs using Raycast's Browser Extension API
export async function getAllBrowserTabs(): Promise<Tab[]> {
  console.log("🌐 Fetching tabs from Raycast Browser Extension...");
  
  try {
    // Use Raycast's Browser Extension API to get all open tabs
    const browserTabs = await BrowserExtension.getTabs();
    console.log(`🟢 Browser Extension: ${browserTabs.length} tabs`);
    
    // Convert to our Tab interface format
    const tabs: Tab[] = browserTabs.map((tab: any, index: number) => ({
      id: tab.id?.toString() || index.toString(),
      title: tab.title || "Untitled",
      url: tab.url || "",
      favicon: tab.favicon,
      active: tab.active || false,
      windowIndex: tab.windowIndex,
      tabIndex: tab.tabIndex || index
    }));
    
    return tabs;
  } catch (error) {
    console.log("🔴 Browser Extension: Failed to get tabs", error);
    console.log("⚠️ Make sure the Raycast Browser Extension is installed");
    return [];
  }
}

// Focus a tab in Arc using AppleScript (ultra-simplified for debugging)
export async function focusTabByTitle(tab: Tab): Promise<void> {
  console.log(`🎯 Focusing Arc tab: "${tab.title}" (URL: ${tab.url})`);
  
  try {
    // First, let's try the simplest possible approach - just activate Arc and search by URL
    await runAppleScript(`
      tell application "Arc"
        activate
        
        -- Simple approach: try to find tab by URL in the frontmost window
        set targetURL to "${tab.url.replace(/["\\]/g, '\\$&')}"
        
        try
          set currentWindow to front window
          repeat with currentTab in tabs of currentWindow
            if URL of currentTab is equal to targetURL then
              tell currentTab to select
              return
            end if
          end repeat
        end try
        
        -- If not found in front window, search all windows
        repeat with currentWindow in windows
          repeat with currentTab in tabs of currentWindow
            if URL of currentTab is equal to targetURL then
              tell currentTab to select
              return
            end if
          end repeat
        end repeat
        
        error "Tab not found"
      end tell
    `);
    
    console.log(`✅ Successfully focused Arc tab: ${tab.title}`);
  } catch (error) {
    console.log(`❌ Failed to focus Arc tab:`, error);
    throw new Error(`Could not find or focus tab "${tab.title}" in Arc`);
  }
}

// Focus a tab using the simplified Arc-only focusing system
export async function smartFocusTab(tab: Tab): Promise<void> {
  console.log(`🎯 Smart focusing tab: ${tab.title} (URL: ${tab.url})`);
  
  try {
    await focusTabByTitle(tab);
  } catch (error) {
    console.log("❌ Arc focusing failed:", error);
    throw new Error(`Could not focus tab "${tab.title}" in Arc`);
  }
}
