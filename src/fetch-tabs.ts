import { BrowserExtension } from "@raycast/api";
import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.join(__dirname, "tabs-store.json");

export async function fetchTabs(): Promise<any[]> {
  const currentTabs = await BrowserExtension.getTabs();
  const activeTabs = currentTabs.filter((tab: any) => tab.active);
  
  let storedTabs: any[] = [];
  try {
    const storedData = await fs.readFile(STORE_PATH, "utf8");
    storedTabs = JSON.parse(storedData);
  } catch (e) {
    storedTabs = [];
  }

  // Merge new active tabs at the start, removing any duplicates first
  for (const active of activeTabs) {
    // Remove any existing entries with the same URL
    storedTabs = storedTabs.filter(tab => tab.url !== active.url);
    // Add new tab at the beginning
    storedTabs.unshift(active);
    // make sure there are no duplicates
    storedTabs = storedTabs.filter((tab, index, self) => index === self.findIndex(t => t.url === tab.url));
  }

  if (storedTabs.length > 50) {
    storedTabs = storedTabs.slice(0, 50);
  }

  await fs.writeFile(STORE_PATH, JSON.stringify(storedTabs, null, 2), "utf8");
  return storedTabs;
}
