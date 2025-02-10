import { BrowserExtension } from "@raycast/api";
import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.join(__dirname, "tabs-store.json");

export async function fetchTabs(): Promise<any[]> {
  // 1. Fetch current active tabs
  const currentTabs = await BrowserExtension.getTabs();
  const activeTabs = currentTabs.filter((tab: any) => tab.active);

  // 2. Load existing store or initialize an empty array
  console.log("Loading stored tabs from ⭐", STORE_PATH);
  console.log("contents of .json file", fs.readFile(STORE_PATH, "utf8"));
  let storedTabs: any[] = [];
  try {
    const storedData = await fs.readFile(STORE_PATH, "utf8");
    storedTabs = JSON.parse(storedData);
  } catch (e) {
    storedTabs = [];
  }

  // 3. Merge new active tabs at the start (avoid duplicate URLs)
  for (const active of activeTabs) {
    const existingIndex = storedTabs.findIndex((tab) => tab.url === active.url);
    if (existingIndex !== -1) {
      // Remove existing entry
      storedTabs.splice(existingIndex, 1);
    }
    // Add new tab at the beginning
    storedTabs.unshift(active);
  }

  // 4. Trim the stored list to last 50 entries (from start)
  if (storedTabs.length > 50) {
    storedTabs = storedTabs.slice(0, 50);
  }

  // 5. Write back the updated store
  await fs.writeFile(STORE_PATH, JSON.stringify(storedTabs, null, 2), "utf8");

  return storedTabs;
}
