import fs from "fs/promises";
import path from "path";
import os from "os";

const DATA_FILE_PATH = path.join(os.homedir(), ".raycast-last-tabs.json");

interface TabData {
  id: number;
  title: string;
  url: string;
  lastAccessed: number;
  favIconUrl?: string;
}

interface TabHistoryData {
  tabs: TabData[];
  lastUpdated: number;
}

export async function fetchTabs(): Promise<TabData[]> {
  try {
    // Read from the file that Chrome extension writes to
    const fileContent = await fs.readFile(DATA_FILE_PATH, "utf8");
    const data: TabHistoryData = JSON.parse(fileContent);
    
    // Return tabs sorted by most recent first (they should already be sorted)
    return data.tabs || [];
  } catch (error) {
    console.error("Error reading tab data:", error);
    
    // Return empty array if file doesn't exist or can't be read
    return [];
  }
}
