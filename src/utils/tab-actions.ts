import { BrowserExtension, open, environment } from "@raycast/api";

export async function focusTabById(tabId: number): Promise<void> {
  try {
    await fetch("http://127.0.0.1:8987/focus-tab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabId }),
    });
  } catch (e) {
    // fallback: do nothing
  }
}

export async function focusOrOpenTab(url: string, tabId?: number): Promise<void> {
  try {
    console.log("🎯 Attempting to focus/open tab:", url, tabId ? `with ID ${tabId}` : "without ID");
    
    // If we have a tabId, try to focus it directly
    if (typeof tabId === "number") {
      console.log("✅ Using tabId to focus:", tabId);
      await focusTabById(tabId);
      return;
    }
    
    // Check if Raycast Browser Extension is available
    if (!environment.canAccess(BrowserExtension)) {
      console.log("❌ Browser Extension not available, using fallback");
      await open(url);
      return;
    }
    
    // Get all tabs from browser
    const tabs = await BrowserExtension.getTabs();
    console.log("📋 Found", tabs.length, "open tabs");
    
    // Look for a tab with the exact URL
    const existingTab = tabs.find(tab => tab.url === url);
    
    if (existingTab && typeof existingTab.id === "number") {
      console.log("✅ Found existing tab with matching URL and id", existingTab.id);
      await focusTabById(existingTab.id);
      return;
    }
    // No existing tab, open a new one
    await open(url);
    console.log("✅ New tab opened successfully");
  } catch (error) {
    console.error("❌ Error with tab focusing:", error);
    // Fallback: use standard open function
    await open(url);
  }
}
