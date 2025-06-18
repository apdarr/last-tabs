import { focusTabById } from "./tab-actions";

export async function focusTabInBrowser(url: string, tabId?: number) {
  if (typeof tabId === "number") {
    // If we have a tabId, use the preferred focus method
    return await focusTabById(tabId);
  }
  
  // Fallback for legacy code that doesn't have a tabId
  console.log("⚠️ focusTabInBrowser called without tabId, this is deprecated");
  try {
    // Post to the local server
    await fetch("http://127.0.0.1:8987/focus-tab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return "Tab focus request sent";
  } catch (error) {
    console.error("Error focusing tab:", error);
    return "Tab focus failed";
  }
}
