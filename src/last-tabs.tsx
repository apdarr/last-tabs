import { ActionPanel, environment, List, Action, Icon, closeMainWindow, BrowserExtension, showToast, Toast } from "@raycast/api";
import { usePromise, useExec } from "@raycast/utils";
import { focusOrOpenTab } from "./utils/tab-actions";
import { tabRefreshHandler } from "./utils/refresh-handler";
import { useMemo, useEffect } from "react";
import os from "os";
import path from "path";

interface HistoryTab {
  id: number;
  title: string;
  url: string;
  lastAccessed: number;
  favIconUrl?: string;
}

interface TabHistoryData {
  tabs: HistoryTab[];
  lastUpdated: number;
}

export default function Command() {
  const dataFilePath = path.join(os.homedir(), ".raycast-last-tabs.json");

  // 1. Fetch tab history for recency data
  const { data: historyData, revalidate } = useExec(
    "cat",
    [dataFilePath],
    {
      keepPreviousData: true,
      parseOutput: ({ stdout, exitCode }) => {
        if (exitCode !== 0 || !stdout) {
          return { tabs: [], lastUpdated: 0 };
        }
        try {
          const parsed = JSON.parse(stdout.toString());
          if (parsed && Array.isArray(parsed.tabs)) {
            return parsed as TabHistoryData;
          }
          return { tabs: [], lastUpdated: 0 };
        } catch (e) {
          console.error("Error parsing tab data:", e);
          return { tabs: [], lastUpdated: 0 };
        }
      },
    }
  );

  // 2. Fetch all currently open tabs
  const { data: openTabs, isLoading: isLoadingOpenTabs, revalidate: revalidateOpenTabs } = usePromise(async () => {
    if (!environment.canAccess(BrowserExtension)) {
      return [];
    }
    return await BrowserExtension.getTabs();
  }, []);

  // 3. Get the current active tab to exclude it from the list
  const activeTab = useMemo(() => {
    if (!openTabs) return null;
    return openTabs.find(tab => tab.active) || null;
  }, [openTabs]);

  // 4. Merge and sort the lists
  const sortedTabs = useMemo(() => {
    if (!openTabs) {
      return [];
    }

    // Create a map of URL -> lastAccessed time from history
    const historyUrlMap = new Map(
      historyData?.tabs?.map((tab: HistoryTab) => [tab.url, tab.lastAccessed]) || []
    );

    // Deduplicate open tabs by URL (keep the first occurrence) and exclude active tab
    const seenUrls = new Set<string>();
    const uniqueOpenTabs = openTabs.filter(tab => {
      // Exclude the currently active tab
      if (tab.active) {
        return false;
      }
      
      if (seenUrls.has(tab.url)) {
        return false;
      }
      seenUrls.add(tab.url);
      return true;
    });

    // Add lastAccessed data and sort
    return uniqueOpenTabs
      .map((tab) => ({
        ...tab,
        lastAccessed: historyUrlMap.get(tab.url) || 0, // Default to 0 if no history
      }))
      .sort((a, b) => {
        // Always sort by lastAccessed time (most recent first), regardless of pinned status
        // This ensures that recently accessed tabs appear first, even if they're not pinned
        if (a.lastAccessed && b.lastAccessed) {
          return b.lastAccessed - a.lastAccessed;
        }
        // If only one has lastAccessed data, prioritize it
        if (a.lastAccessed && !b.lastAccessed) return -1;
        if (!a.lastAccessed && b.lastAccessed) return 1;
        // If neither has history, maintain original order (but this shouldn't favor pinned tabs)
        return 0;
      });
  }, [openTabs, historyData]);

  // 5. Set up refresh handler and lifecycle management
  useEffect(() => {
    // Configure the refresh handler with our revalidation functions
    tabRefreshHandler.setCallbacks({
      revalidateHistory: revalidate,
      revalidateOpenTabs: revalidateOpenTabs,
    });

    // Initial refresh to ensure we have latest data
    tabRefreshHandler.refreshAll();

    // Cleanup function for when the component unmounts (Raycast window closes)
    return () => {
      console.log('🚪 Extension window closing, scheduling refresh...');
      // Schedule a delayed refresh for the next time the extension opens
      tabRefreshHandler.scheduleDelayedRefresh(200);
    };
  }, [revalidate, revalidateOpenTabs]);

  const isLoading = isLoadingOpenTabs;

  if (!environment.canAccess(BrowserExtension)) {
    return (
      <List>
        <List.EmptyView
          title="Browser Extension Required"
          description="Please install the Raycast Browser Extension to use this command."
          icon={Icon.ExclamationMark}
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search recent tabs...">
      {sortedTabs.map((tab, index) => (
        <List.Item
          key={tab.url + index}
          title={tab.title || "Untitled"}
          subtitle={tab.url}
          icon={tab.favicon || Icon.Globe}
          accessories={[
            { text: `#${index + 1}` },
            { text: tab.lastAccessed && tab.lastAccessed > 0 ? new Date(tab.lastAccessed).toLocaleTimeString() : "New" },
            // Add indicator if this is a recently accessed tab
            ...(tab.lastAccessed && tab.lastAccessed > 0 && Date.now() - tab.lastAccessed < 60 * 60 * 1000 ? [{ text: "🕐 Recent" }] : [])
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Focus Tab"
                icon={Icon.Eye}
                onAction={async () => {
                  await focusOrOpenTab(tab.url);
                  await closeMainWindow({ clearRootSearch: true });
                  
                  // Use the refresh handler to update data after tab focus
                  setTimeout(() => {
                    tabRefreshHandler.refreshAll();
                  }, 300); // Give the browser time to process the tab change
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
                  console.log('🔄 Manual refresh triggered');
                  console.log('Active tab:', activeTab?.url);
                  console.log('Total open tabs:', openTabs?.length);
                  console.log('History tabs:', historyData?.tabs?.length);
                  
                  const toast = await showToast({
                    style: Toast.Style.Animated,
                    title: "Refreshing tab list..."
                  });
                  
                  await tabRefreshHandler.refreshAll();
                  
                  // Update toast after refresh
                  setTimeout(() => {
                    toast.style = Toast.Style.Success;
                    toast.title = "Tab list refreshed";
                  }, 500);
                }}
              />
              <Action
                title="Debug Info"
                icon={Icon.Bug}
                shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                onAction={() => {
                  console.log('=== DEBUG INFO ===');
                  console.log('Active tab:', activeTab);
                  console.log('All open tabs:', openTabs);
                  console.log('History data:', historyData);
                  console.log('Sorted tabs count:', sortedTabs.length);
                  console.log('==================');
                }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && sortedTabs.length === 0 && (
        <List.EmptyView
          title="No Recent Tabs Found"
          description={`${activeTab ? `Current tab (${activeTab.title}) is hidden from this list. ` : ''}Make sure you have other tabs open and the Chrome extension is running to track tab history.`}
          icon={Icon.Globe}
        />
      )}
    </List>
  );
}
