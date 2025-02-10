import { ActionPanel, environment, List, Action, Icon } from "@raycast/api";
import { usePromise, useFrecencySorting } from "@raycast/utils";
import { fetchTabs } from "./fetch-tabs";

interface Tab {
  id: number;
  title: string;
  url: string;
  active: boolean;
  // ...other fields...
}

export default function Command() {
  console.log("launchType", environment.launchType);
  const { data: tabs, isLoading } = usePromise(fetchTabs);
  // Convert numeric id to string before using frecency sorting
  const stringTabs = (tabs ?? []).map((tab: Tab) => ({ ...tab, id: String(tab.id) }));
  const { data: sortedTabs, visitItem, resetRanking } = useFrecencySorting<Tab>(stringTabs);

  return (
    <List isLoading={isLoading}>
      {sortedTabs.map((tab) => (
        <List.Item
          key={tab.id}
          title={tab.title || "Untitled"}
          subtitle={tab.url}
          icon={Icon.Globe}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={tab.url} onOpen={() => visitItem(tab)} />
              <Action.CopyToClipboard content={tab.url} onCopy={() => visitItem(tab)} />
              <Action title="Reset Ranking" icon={Icon.ArrowCounterClockwise} onAction={() => resetRanking(tab)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
