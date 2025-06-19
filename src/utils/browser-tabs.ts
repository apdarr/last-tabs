import { runAppleScript } from "@raycast/utils";

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  windowIndex?: number;
  tabIndex?: number;
  active?: boolean;
}

export interface TabWithHistory extends Tab {
  lastAccessed: number;
  accessCount: number;
}

// Remove Chrome tab fetching support - focusing only on Arc
// Safari support removed as per requirements

// Safari support removed as per requirements

// Get tabs from Arc using AppleScript (based on the Arc extension you shared)
export async function getArcTabs(): Promise<Tab[]> {
  try {
    const response = await runAppleScript(`
      on escape_value(this_text)
        set AppleScript's text item delimiters to "\\\\"
        set the item_list to every text item of this_text
        set AppleScript's text item delimiters to "\\\\\\\\"
        set this_text to the item_list as string
        set AppleScript's text item delimiters to "\\""
        set the item_list to every text item of this_text
        set AppleScript's text item delimiters to "\\\\\\""
        set this_text to the item_list as string
        set AppleScript's text item delimiters to ""
        return this_text
      end escape_value

      set _output to ""

      tell application "Arc"
        if (count of windows) is 0 then
          return "[]"
        end if

        tell first window
          set allTabs to properties of every tab
        end tell
        set tabsCount to count of allTabs
        repeat with i from 1 to tabsCount
          set _tab to item i of allTabs
          set _title to my escape_value(get title of _tab)
          set _url to get URL of _tab
          set _id to get id of _tab
          set _location to get location of _tab
          
          -- Add favicon support for Arc
          set _favicon to ""
          if _url starts with "http" then
            set _domain to ""
            set _urlParts to my split_string(_url, "/")
            if (count of _urlParts) > 2 then
              set _domain to item 3 of _urlParts
              set _favicon to "https://" & _domain & "/favicon.ico"
            end if
          end if
          
          set _output to (_output & "{ \\"title\\": \\"" & _title & "\\", \\"url\\": \\"" & _url & "\\", \\"id\\": \\"" & _id & "\\", \\"location\\": \\"" & _location & "\\", \\"favicon\\": \\"" & _favicon & "\\" }")
          
          if i < tabsCount then
            set _output to (_output & ",\\n")
          else
            set _output to (_output & "\\n")
          end if

        end repeat
      end tell
      
      on split_string(theString, theDelimiter)
        set oldDelimiters to AppleScript's text item delimiters
        set AppleScript's text item delimiters to theDelimiter
        set theArray to every text item of theString
        set AppleScript's text item delimiters to oldDelimiters
        return theArray
      end split_string
      
      return "[\\n" & _output & "\\n]"
    `);

    return response ? (JSON.parse(response) as Tab[]) : [];
  } catch (error) {
    console.error("Error getting Arc tabs:", error);
    return [];
  }
}

// Get all tabs from Arc only (simplified approach)
export async function getAllBrowserTabs(): Promise<Tab[]> {
  console.log("🌐 Fetching tabs from Arc...");
  
  try {
    const arcTabs = await getArcTabs();
    console.log(`🟢 Arc: ${arcTabs.length} tabs`);
    return arcTabs;
  } catch (error) {
    console.log("🔴 Arc: Failed to get tabs", error);
    return [];
  }
}

// Focus a tab in Arc using URL matching (simplified approach)
export async function focusTab(tab: Tab): Promise<void> {
  console.log(`🎯 Focusing Arc tab: ${tab.title} (URL: ${tab.url})`);
  
  try {
    await runAppleScript(`
      tell application "Arc"
        if (count of windows) is 0 then
          make new window
        end if
        set foundTab to false
        repeat with aTab in every tab of first window
          set currentURL to URL of aTab
          if currentURL is equal to "${tab.url}" then
            set foundTab to true
            tell aTab to select
            exit repeat 
          end if
        end repeat
        if foundTab is false then
          error "Tab not found"
        end if
        activate
      end tell
    `);
    
    console.log(`✅ Successfully focused Arc tab: ${tab.title}`);
  } catch (error) {
    console.error(`❌ Failed to focus Arc tab:`, error);
    throw error;
  }
}

// Focus a tab in Arc (simplified - no browser detection needed)
export async function smartFocusTab(tab: Tab): Promise<void> {
  console.log(`🎯 Focusing tab: ${tab.title} (URL: ${tab.url})`);
  
  try {
    await focusTab(tab);
  } catch (error) {
    console.log("❌ Arc focusing failed:", error);
    throw new Error("Could not focus tab in Arc");
  }
}
