import { smartFocusTab, Tab } from "./browser-tabs";
import { open } from "@raycast/api";

export async function focusOrOpenTab(url: string, tabInfo?: Partial<Tab>): Promise<void> {
  try {
    console.log(`🎯 Attempting to focus tab: ${url}`);
    
    // Create a tab object for focusing
    const tab: Tab = {
      id: tabInfo?.id || '',
      title: tabInfo?.title || '',
      url: url,
      favicon: tabInfo?.favicon,
      windowIndex: tabInfo?.windowIndex,
      tabIndex: tabInfo?.tabIndex
    };

    // Try to focus the existing tab using our smart focus utility
    await smartFocusTab(tab);
    
    console.log(`✅ Successfully focused tab: ${tab.title || url}`);
  } catch (error) {
    console.log(`⚠️ Could not focus existing tab, opening new one: ${error}`);
    
    // If focusing failed, open the URL in the default browser
    try {
      await open(url);
      console.log(`🔗 Opened URL in default browser: ${url}`);
    } catch (openError) {
      console.error(`❌ Failed to open URL in browser:`, openError);
      throw new Error(`Could not focus or open tab: ${url}`);
    }
  }
}
