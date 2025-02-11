import { BrowserExtension, open } from "@raycast/api";
import { focusTabInBrowser } from "./focus-tab";

export async function focusOrOpenTab(url: string) {
  // Check if tab is currently open in browser
  const currentTabs = await BrowserExtension.getTabs();
  const existingTab = currentTabs.find(tab => tab.url === url);

  if (existingTab) {
    // Tab exists, focus it
    return await focusTabInBrowser(url);
  } else {
    // Tab doesn't exist, open new
    return await open(url);
  }
}
