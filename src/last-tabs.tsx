import { 
  ActionPanel, 
  List, 
  Action, 
  Icon, 
  closeMainWindow, 
  showToast, 
  Toast,
  environment,
  BrowserExtension
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { focusOrOpenTab } from "./utils/tab-actions";
import { getAllBrowserTabs, Tab } from "./utils/browser-tabs";
import { tabHistoryManager } from "./utils/tab-history";
import { useEffect } from "react";

export default function Command() {
  // Initialize tab history manager
  useEffect(() => {
    tabHistoryManager.initialize();
  }, []);

  // Check if Browser Extension is available
  const canAccessBrowserExtension = environment.canAccess(BrowserExtension);

  // Fetch tabs using Raycast Browser Extension and merge with Chrome extension recency data
  const { data: sortedTabs, isLoading, revalidate } = usePromise(async () => {
    console.log("🔄 Fetching tabs...");
    
    if (!canAccessBrowserExtension) {
      console.log("❌ Browser Extension not available");
      await showToast({
        style: Toast.Style.Failure,
        title: "Browser Extension Required",
        message: "Please install the Raycast Browser Extension"
      });
      return [];
    }

    // Get current browser tabs using Raycast API
    const currentTabs = await getAllBrowserTabs();
    console.log(`📱 Found ${currentTabs.length} current tabs from Browser Extension`);
    
    // Get tab history with Chrome extension recency data
    const tabsWithHistory = await tabHistoryManager.getTabHistory(currentTabs);
    console.log(`📚 Got history for ${tabsWithHistory.length} tabs`);
    
    // Show ALL tabs sorted by recency (no filtering)
    const sortedTabs = tabsWithHistory
      .sort((a, b) => {
        // Sort by recency: tabs with lastAccessed > 0 go first (sorted by recency)
        // tabs with lastAccessed = 0 go after (no particular order)
        if (a.lastAccessed === 0 && b.lastAccessed === 0) return 0; // Both have no history
        if (a.lastAccessed === 0) return 1; // a has no history, goes after b
        if (b.lastAccessed === 0) return -1; // b has no history, goes after a
        return b.lastAccessed - a.lastAccessed; // Both have history, sort by recency
      })
      .slice(0, 50); // Limit to top 50 for performance
    
    console.log(`✅ Returning ${sortedTabs.length} tabs (including ${sortedTabs.filter(t => t.lastAccessed === 0).length} without recency data)`);
    return sortedTabs;
  }, []);

  const handleTabSelection = async (tab: Tab) => {
    try {
      // Record this access in our history (updates Chrome extension data)
      await tabHistoryManager.recordTabAccess(tab);
      
      // Focus the tab using AppleScript
      await focusOrOpenTab(tab.url, {
        title: tab.title,
        favicon: tab.favicon
      });
      
      await closeMainWindow();
    } catch (error) {
      console.error("Error selecting tab:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open tab",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const formatLastAccessed = (timestamp: number): string => {
    if (timestamp === 0) return "No history";
    
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (!canAccessBrowserExtension) {
    return (
      <List>
        <List.EmptyView
          title="Browser Extension Required"
          description="Please install the Raycast Browser Extension to use this feature"
          icon={Icon.ExclamationMark}
        />
      </List>
    );
  }

  return (
    <List 
      isLoading={isLoading}
      searchBarPlaceholder="Search tabs..."
      throttle={true}
    >
      {sortedTabs?.map((tab) => (
        <List.Item
          key={tab.url}
          title={tab.title || "Untitled"}
          subtitle={new URL(tab.url).hostname}
          accessories={[
            { text: formatLastAccessed(tab.lastAccessed) },
            { text: tab.accessCount ? `(${tab.accessCount})` : "" }
          ]}
          icon={tab.favicon || Icon.Globe}
          actions={
            <ActionPanel>
              <Action
                title="Open Tab"
                icon={Icon.ArrowRight}
                onAction={() => handleTabSelection(tab)}
              />
              <Action.CopyToClipboard
                title="Copy URL"
                content={tab.url}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={async () => {
                  await revalidate();
                  await showToast({
                    style: Toast.Style.Success,
                    title: "Refreshed",
                    message: "Tab data has been updated"
                  });
                }}
              />
              <Action
                title="Clear History"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
                onAction={async () => {
                  await tabHistoryManager.clearHistory();
                  await revalidate();
                  await showToast({
                    style: Toast.Style.Success,
                    title: "History Cleared",
                    message: "All tab history has been cleared"
                  });
                }}
              />
            </ActionPanel>
          }
        />
      ))}
      
      {!isLoading && (!sortedTabs || sortedTabs.length === 0) && (
        <List.EmptyView
          title="No tabs found"
          description="Make sure you have open tabs in your browser. The Chrome extension will track activity over time."
          icon={Icon.Globe}
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={async () => {
                  await revalidate();
                  await showToast({
                    style: Toast.Style.Success,
                    title: "Refreshed",
                    message: "Tab data has been updated"
                  });
                }}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
