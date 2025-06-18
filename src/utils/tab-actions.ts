import { runAppleScript } from "@raycast/utils";
import { open } from "@raycast/api";

// Arc-specific AppleScript 
const scriptFocusArcTabByUrl = (url: string) => `
tell application "Arc"
    if not running then
        error "Arc is not running"
    end if
    
    activate
    set foundTab to false
    set targetURL to "${url.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}"
    
    repeat with aTab in every tab of first window
        set currentURL to URL of aTab
        if currentURL is equal to targetURL then
            set foundTab to true
            tell aTab to select
            exit repeat 
        end if
    end repeat
    
    if foundTab is false then
        error "Tab not found"
    end if
end tell
`;

// Chromium-based browser AppleScript
const scriptFocusChromiumTabByUrl = (browserName: string, url: string) => `
tell application "${browserName}"
    if not running then
        error "${browserName} is not running"
    end if
    
    activate
    set foundTab to false
    set targetURL to "${url.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}"
    
    repeat with aWindow in every window
        repeat with aTab in every tab of aWindow
            set tabURL to URL of aTab
            if tabURL is equal to targetURL then
                set foundTab to true
                set index of aWindow to 1
                set active tab index of aWindow to index of aTab
                exit repeat
            end if
        end repeat
        if foundTab then exit repeat
    end repeat
    
    if not foundTab then
        error "Tab not found"
    end if
end tell
`;

// Detect which supported browser is running
async function detectRunningBrowser(): Promise<string | null> {
  const browsers = ["Arc", "Google Chrome", "Chromium", "Brave Browser"];

  for (const browser of browsers) {
    try {
      const script = `tell application "System Events" to (name of processes) contains "${browser}"`;
      const result = await runAppleScript(script);
      if (result === "true") {
        console.log(`✅ Detected running browser: ${browser}`);
        return browser;
      }
    } catch (error) {
      // Ignore errors (e.g., browser not installed)
    }
  }

  console.log("❌ No supported running browser detected.");
  return null;
}

export async function focusOrOpenTab(url: string): Promise<void> {
  try {
    console.log(`🎯 Attempting to focus tab: ${url}`);
    const browserName = await detectRunningBrowser();

    if (browserName) {
      let script: string;
      
      if (browserName === "Arc") {
        script = scriptFocusArcTabByUrl(url);
      } else {
        script = scriptFocusChromiumTabByUrl(browserName, url);
      }
      
      await runAppleScript(script);
      console.log(`✅ Successfully focused tab in ${browserName}`);
      return;
    }

    // Fallback if no running browser is found
    throw new Error("No running supported browser detected to focus tab.");
  } catch (error) {
    console.log(`⚠️ Could not focus existing tab, opening new one: ${error}`);
    // If focusing fails for any reason, open the URL as a fallback.
    await open(url);
  }
}
