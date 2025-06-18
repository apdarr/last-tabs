import { ActionPanel, environment, List, Action, Icon, closeMainWindow, BrowserExtension } from "@raycast/api";
import { usePromise, useExec } from "@raycast/utils";
import { focusOrOpenTab } from "./utils/tab-actions";
import { useMemo } from "react";
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
  const { data: openTabs, isLoading: isLoadingOpenTabs } = usePromise(async () => {
    if (!environment.canAccess(BrowserExtension)) {
      return [];
    }
    return await BrowserExtension.getTabs();
  }, []);

  // 3. Merge and sort the lists
  const sortedTabs = useMemo(() => {
    if (!openTabs) {
      return [];
    }

    // Create a map of URL -> lastAccessed time from history
    const historyUrlMap = new Map(
      historyData?.tabs?.map((tab: HistoryTab) => [tab.url, tab.lastAccessed]) || []
    );

    // Deduplicate open tabs by URL (keep the first occurrence)
    const seenUrls = new Set<string>();
    const uniqueOpenTabs = openTabs.filter(tab => {
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
        // Sort by lastAccessed if both have it, otherwise put tabs with history first
        if (a.lastAccessed && b.lastAccessed) {
          return b.lastAccessed - a.lastAccessed;
        }
        if (a.lastAccessed && !b.lastAccessed) return -1;
        if (!a.lastAccessed && b.lastAccessed) return 1;
        return 0; // Both have no history, keep original order
      });
  }, [openTabs, historyData]);

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
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Focus Tab"
                icon={Icon.Eye}
                onAction={async () => {
                  await focusOrOpenTab(tab.url);
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
                onAction={() => revalidate()}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && sortedTabs.length === 0 && (
        <List.EmptyView
          title="No Open Tabs Found"
          description="Make sure you have tabs open in your browser and the Raycast Browser Extension is installed."
          icon={Icon.Globe}
        />
      )}
    </List>
  );
}
