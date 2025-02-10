import { updateCommandMetadata } from "@raycast/api";
import { fetchTabs } from "./fetch-tabs";

export default async function Command() {
  const tabs = await fetchTabs();
  await updateCommandMetadata({ subtitle: `Last Tabs: ${tabs.length}` });
}
