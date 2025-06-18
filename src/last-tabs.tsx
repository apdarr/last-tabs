import { ActionPanel, environment, List, Action, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { fetchTabs } from "./fetch-tabs";
import { focusOrOpenTab } from "./utils/tab-actions";
import { closeMainWindow } from "@raycast/api";
import { useEffect } from "react";

interface Tab {
  id: number;
  title: string;
  url: string;
  lastAccessed: number;
  favIconUrl?: string;
}

export default function Command() {
  console.log("launchType", environment.launchType);
  
  const { data: tabs, isLoading, revalidate } = usePromise(fetchTabs);

  // Force reload every time the command is launched
  useEffect(() => {
    console.log("🔄 Command mounted, forcing data reload...");
    revalidate();
  }, [revalidate]);

  return (
    <List isLoading={isLoading}>
      {(tabs || []).map((tab: Tab, index: number) => (
        <List.Item
          key={`${tab.id}-${tab.url}`}
          title={tab.title || "Untitled"}
          subtitle={tab.url}
          icon={tab.favIconUrl || Icon.Globe}
          accessories={[
            { text: `#${index + 1}` },
            { text: new Date(tab.lastAccessed).toLocaleTimeString() }
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Focus or Open Tab"
                icon={Icon.Eye}
                onAction={async () => {
                  if (tab.id) {
                    // Try focusing by tabId first
                    await focusOrOpenTab(tab.url, tab.id);
                  } else {
                    // Fall back to URL-based focusing
                    await focusOrOpenTab(tab.url);
                  }
                  await closeMainWindow({ clearRootSearch: true });
                }}
              />
              <Action.CopyToClipboard 
                content={tab.url} 
                title="Copy URL"
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard 
                content={tab.title || "Untitled"} 
                title="Copy Title"
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
              <Action
                title="Refresh List"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => {
                  console.log("🔄 Manual refresh triggered");
                  revalidate();
                }}
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && (!tabs || tabs.length === 0) && (
        <List.EmptyView
          title="No previous tabs found"
          description="Switch between a few tabs in Chrome to start building your history. Note: The current active tab is excluded from this list."
          icon={Icon.Globe}
          actions={
            <ActionPanel>
              <Action
                title="Refresh List"
                icon={Icon.ArrowClockwise}
                onAction={() => {
                  console.log("🔄 Manual refresh from empty view");
                  revalidate();
                }}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
