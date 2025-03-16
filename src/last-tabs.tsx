import { ActionPanel, environment, List, Action, Icon } from "@raycast/api";
import { usePromise, useFrecencySorting } from "@raycast/utils";
import { fetchTabs } from "./fetch-tabs";
import { focusOrOpenTab } from "./utils/tab-actions";
import { closeMainWindow } from "@raycast/api";

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
  const { data: sortedTabs, visitItem, resetRanking } = useFrecencySorting(stringTabs);

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
              <Action
                title="Focus or Open Tab"
                icon={Icon.Eye}
                onAction={async () => {
                  await focusOrOpenTab(tab.url);
                  visitItem(tab);
                  await closeMainWindow({ clearRootSearch: true });
                }}
              />
              <Action.CopyToClipboard content={tab.url} onCopy={() => visitItem(tab)} />
              <Action title="Reset Ranking" icon={Icon.ArrowCounterClockwise} onAction={() => resetRanking(tab)} />
            </ActionPanel>
          }
        />
      ))}
    </List>

  );
}
