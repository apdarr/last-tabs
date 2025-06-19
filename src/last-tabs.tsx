import { 
  ActionPanel, 
  List, 
  Action, 
  Icon, 
  closeMainWindow, 
  showToast, 
  Toast,
  environment
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { focusOrOpenTab } from "./utils/tab-actions";
import { tabRefreshHandler } from "./utils/refresh-handler";
import { getAllBrowserTabs } from "./utils/browser-tabs";
import { tabHistoryManager } from "./utils/tab-history";
import { useMemo, useEffect } from "react";

export default function Command() {
  // Initialize tab history manager
  useEffect(() => {
    tabHistoryManager.initialize();
  }, []);

  // Primary data source: Browser tabs via AppleScript
  const { data: allTabs, isLoading: isLoadingTabs, revalidate: revalidateTabs } = usePromise(async () => {
    console.log("🔄 Fetching tabs from all browsers...");
    const tabs = await getAllBrowserTabs();
    console.log(`� Total tabs fetched: ${tabs.length}`);
    return tabs;
  }, []);

  // Get tab history data for ranking
  const { data: tabsWithHistory, isLoading: isLoadingHistory, revalidate: revalidateHistory } = usePromise(
    async (tabs) => {
      if (!tabs || tabs.length === 0) {
        return [];
      }
      console.log("📚 Getting tab history for ranking...");
      const tabsWithHistory = await tabHistoryManager.getTabHistory(tabs);
      return tabsWithHistory;
    }, 
    [allTabs]
  );

  // Find the active tab (to exclude from results)
  const activeTab = useMemo(() => {
    return allTabs?.find(tab => tab.active) || null;
  }, [allTabs]);

  // Build the final sorted list - exclude active tab and filter by history
  const sortedTabs = useMemo(() => {
    if (!tabsWithHistory || tabsWithHistory.length === 0) {
      console.log("⚠️ No tabs with history available");
      return [];
    }

    console.log("🧮 Processing tabs - Total with history:", tabsWithHistory.length, "Active tab:", activeTab?.title || 'none');

    // Filter out the active tab and tabs with no history data
    const validTabs = tabsWithHistory.filter(tab => {
      // Skip the active tab (most important filter)
      if (tab.active) {
        console.log("🚫 Excluding active tab:", tab.title);
        return false;
      }
      
      // Only show tabs that have some history (were accessed before)
      if (tab.lastAccessed === 0) {
        return false;
      }
      
      return true;
    });

    console.log("✅ Valid tabs after filtering:", validTabs.length);

    // Tabs are already sorted by lastAccessed in the history manager
    const sorted = validTabs.slice(0, 20); // Limit to top 20 for performance

    console.log("🎯 Final sorted tabs:", sorted.length);
    console.log("📋 Top 3:", sorted.slice(0, 3).map(t => ({ 
      title: t.title, 
      lastAccessed: new Date(t.lastAccessed).toLocaleString(),
      accessCount: t.accessCount
    })));
    
    return sorted;
  }, [tabsWithHistory, activeTab]);

  // Set up refresh handler and lifecycle management
  useEffect(() => {
    // Configure the refresh handler with our revalidation functions
    tabRefreshHandler.setCallbacks({
      revalidateHistory: revalidateHistory,
      revalidateOpenTabs: revalidateTabs,
    });

    // Immediate refresh when extension opens
    console.log('🎬 Extension opening, triggering refresh...');
    tabRefreshHandler.refreshOnOpen();

    // Cleanup function for when the component unmounts (Raycast window closes)
    return () => {
      console.log('🚪 Extension window closing, recording final state...');
      tabRefreshHandler.refreshOnClose();
    };
  }, [revalidateHistory, revalidateTabs]);

  const isLoading = isLoadingTabs || isLoadingHistory;

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search recent tabs...">
      {sortedTabs.map((tab, index) => (
        <List.Item
          key={`${tab.url}-${index}`}
          title={tab.title || "Untitled"}
          subtitle={tab.url}
          icon={tab.favicon || Icon.Globe}
          accessories={[
            { text: `#${index + 1}` },
            { text: new Date(tab.lastAccessed).toLocaleTimeString() },
            // Visit count removed as per requirements
            // Add indicator if this is a recently accessed tab (within last hour)
            ...(Date.now() - tab.lastAccessed < 60 * 60 * 1000 ? [{ text: "🕐", tooltip: "Recently accessed" }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Focus Tab"
                icon={Icon.Eye}
                onAction={async () => {
                  await focusOrOpenTab(tab.url, tab);
                  await closeMainWindow({ clearRootSearch: true });
                }}
              />
              <Action.CopyToClipboard content={tab.url} title="Copy URL" shortcut={{ modifiers: ["cmd"], key: "c" }} />
              <Action.CopyToClipboard
                content={tab.title || "Untitled"}
                title="Copy Title"
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action
                title="Refresh List"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={async () => {
                  const toast = await showToast({
                    style: Toast.Style.Animated,
                    title: "Refreshing tab list...",
                  });

                  await tabRefreshHandler.refreshImmediate();

                  // Update toast after refresh
                  setTimeout(() => {
                    toast.style = Toast.Style.Success;
                    toast.title = "Tab list refreshed";
                  }, 500);
                }}
              />
              <Action
                title="Clear History"
                icon={Icon.Trash}
                shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
                onAction={async () => {
                  await tabHistoryManager.clearHistory();
                  await showToast({
                    style: Toast.Style.Success,
                    title: "Tab history cleared",
                  });
                  revalidateHistory();
                }}
              />
              <Action
                title="Debug Info"
                icon={Icon.Bug}
                shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                onAction={async () => {
                  const stats = tabHistoryManager.getStatistics();
                  console.log("=== DEBUG INFO ===");
                  console.log("Active tab:", activeTab);
                  console.log("Total open tabs:", allTabs?.length);
                  console.log("Tabs with history:", tabsWithHistory?.length);
                  console.log("History statistics:", stats);
                  console.log("All open tabs (raw):", allTabs);
                  console.log("Sorted tabs count:", sortedTabs.length);
                  console.log("==================");
                  await showToast({
                    style: Toast.Style.Success,
                    title: "Debug info logged to console",
                  });
                }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && sortedTabs.length === 0 && (
        <List.EmptyView
          title="No Recent Tabs Found"
          description={
            activeTab
              ? `Current tab (${activeTab.title}) is hidden from this list. Use other tabs first to build up history.`
              : "No tab history found. Browse some websites in Arc to build up your tab history."
          }
          icon={Icon.Clock}
        />
      )}
    </List>
  );
}
