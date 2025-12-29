import { BrowserExtension, getPreferenceValues } from "@raycast/api";
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

type Preferences = {
  browser: "arc" | "chrome";
};

function getPreferredBrowser(): Preferences["browser"] {
  const { browser } = getPreferenceValues<Preferences>();
  return browser || "arc";
}

function escapeForAppleScript(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
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

async function focusTabInArc(tab: Tab): Promise<void> {
  console.log(`🎯 Focusing Arc tab: "${tab.title}" (URL: ${tab.url})`);

  await runAppleScript(`
    tell application "Arc"
      activate

      set targetURL to "${escapeForAppleScript(tab.url)}"

      try
        set currentWindow to front window
        repeat with currentTab in tabs of currentWindow
          if URL of currentTab is equal to targetURL then
            tell currentTab to select
            return
          end if
        end repeat
      end try

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
}

async function focusTabInChrome(tab: Tab): Promise<void> {
  console.log(`🎯 Focusing Chrome tab: "${tab.title}" (URL: ${tab.url})`);

  await runAppleScript(`
    tell application "Google Chrome"
      activate
      set targetURL to "${escapeForAppleScript(tab.url)}"

      repeat with currentWindow in windows
        set tabIndex to 1
        repeat with currentTab in tabs of currentWindow
          if URL of currentTab is equal to targetURL then
            set active tab index of currentWindow to tabIndex
            set index of currentWindow to 1
            return
          end if
          set tabIndex to tabIndex + 1
        end repeat
      end repeat

      error "Tab not found"
    end tell
  `);

  console.log(`✅ Successfully focused Chrome tab: ${tab.title}`);
}

export async function focusTabByTitle(tab: Tab): Promise<void> {
  const browser = getPreferredBrowser();

  try {
    if (browser === "chrome") {
      await focusTabInChrome(tab);
    } else {
      await focusTabInArc(tab);
    }
  } catch (error) {
    console.log(`❌ Failed to focus ${browser} tab:`, error);
    throw new Error(`Could not find or focus tab "${tab.title}" in ${browser === "chrome" ? "Google Chrome" : "Arc"}`);
  }
}

// Focus a tab using the user's preferred browser selection
export async function smartFocusTab(tab: Tab): Promise<void> {
  console.log(`🎯 Smart focusing tab in ${getPreferredBrowser()}: ${tab.title} (URL: ${tab.url})`);
  await focusTabByTitle(tab);
}
