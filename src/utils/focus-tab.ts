import { runAppleScript } from "@raycast/utils";

export async function focusTabInBrowser(url: string) {
  const script = `
    tell application "Arc"
      tell front window
        set foundTab to false
        -- Try each space
        repeat with s in spaces
          tell s
            -- Try each tab in the space
            repeat with t in tabs
              if URL of t contains "${url}" then
                focus
                tell t to select
                set foundTab to true
                exit repeat
              end if
            end repeat
          end tell
          if foundTab then exit repeat
        end repeat
      end tell
      activate
    end tell
  `;
  
  return await runAppleScript(script, { humanReadableOutput: true });
}
