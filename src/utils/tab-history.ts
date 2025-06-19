import { LocalStorage } from "@raycast/api";
import { Tab, TabWithHistory } from "./browser-tabs";
import os from "os";
import path from "path";
import { promises as fs } from "fs";

const HISTORY_KEY = "tab-access-history";
const MAX_HISTORY_ENTRIES = 100;
const CHROME_EXTENSION_DATA_PATH = path.join(os.homedir(), ".raycast-last-tabs.json");

interface TabHistoryEntry {
  url: string;
  title: string;
  lastAccessed: number;
  accessCount: number;
  favicon?: string;
}

interface ChromeExtensionTab {
  id: number;
  title: string;
  url: string;
  lastAccessed: number;
  favIconUrl?: string;
}

interface ChromeExtensionData {
  tabs: ChromeExtensionTab[];
  lastUpdated: number;
}

export class TabHistoryManager {
  private historyCache: Map<string, TabHistoryEntry> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load existing history from LocalStorage
      const historyData = await LocalStorage.getItem<string>(HISTORY_KEY);
      if (historyData) {
        const entries: TabHistoryEntry[] = JSON.parse(historyData);
        for (const entry of entries) {
          this.historyCache.set(entry.url, entry);
        }
        console.log(`📚 Loaded ${entries.length} tab history entries from LocalStorage`);
      }
      
      // Merge with Chrome extension data if available
      await this.mergeWithChromeExtensionData();
      
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing tab history:", error);
      this.initialized = true; // Don't block the app
    }
  }

  async mergeWithChromeExtensionData(): Promise<void> {
    try {
      const chromeData = await fs.readFile(CHROME_EXTENSION_DATA_PATH, 'utf8');
      const parsed: ChromeExtensionData = JSON.parse(chromeData);
      
      if (parsed.tabs && Array.isArray(parsed.tabs)) {
        let mergedCount = 0;
        for (const chromeTab of parsed.tabs) {
          if (chromeTab.url && chromeTab.lastAccessed) {
            const existing = this.historyCache.get(chromeTab.url);
            if (!existing || existing.lastAccessed < chromeTab.lastAccessed) {
              this.historyCache.set(chromeTab.url, {
                url: chromeTab.url,
                title: chromeTab.title || '',
                lastAccessed: chromeTab.lastAccessed,
                accessCount: existing ? existing.accessCount + 1 : 1,
                favicon: chromeTab.favIconUrl // Use Chrome's favIconUrl for consistent favicons
              });
              mergedCount++;
            }
          }
        }
        console.log(`🔄 Merged ${mergedCount} entries from Chrome extension data`);
      }
    } catch (error) {
      console.log("📡 Chrome extension data not available or invalid:", error instanceof Error ? error.message : String(error));
    }
  }

  async recordTabAccess(tab: Tab): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const now = Date.now();
    const existing = this.historyCache.get(tab.url);
    
    const entry: TabHistoryEntry = {
      url: tab.url,
      title: tab.title,
      lastAccessed: now,
      accessCount: existing ? existing.accessCount + 1 : 1,
      favicon: tab.favicon
    };
    
    this.historyCache.set(tab.url, entry);
    
    // Persist to LocalStorage (async, non-blocking)
    this.persistHistory().catch(error => 
      console.error("Failed to persist tab history:", error)
    );
    
    console.log(`📝 Recorded access to: ${tab.title}`);
  }

  async getTabHistory(currentTabs: Tab[]): Promise<TabWithHistory[]> {
    if (!this.initialized) await this.initialize();
    
    // Refresh Chrome extension data before getting history - this is critical for accurate recency
    await this.mergeWithChromeExtensionData();
    
    const tabsWithHistory: TabWithHistory[] = [];
    
    for (const tab of currentTabs) {
      const historyEntry = this.historyCache.get(tab.url);
      
      tabsWithHistory.push({
        ...tab,
        lastAccessed: historyEntry?.lastAccessed || 0,
        accessCount: historyEntry?.accessCount || 0,
        // Ensure favicon is always set (prioritize Chrome extension data)
        favicon: historyEntry?.favicon || tab.favicon
      });
    }
    
    // Sort by last accessed time (most recent first)
    return tabsWithHistory.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  async getRecentTabs(limit: number = 20): Promise<TabHistoryEntry[]> {
    if (!this.initialized) await this.initialize();
    
    await this.mergeWithChromeExtensionData();
    
    return Array.from(this.historyCache.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, limit);
  }

  private async persistHistory(): Promise<void> {
    try {
      const entries = Array.from(this.historyCache.values())
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, MAX_HISTORY_ENTRIES);
      
      await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Failed to save tab history:", error);
    }
  }

  async clearHistory(): Promise<void> {
    this.historyCache.clear();
    await LocalStorage.removeItem(HISTORY_KEY);
    console.log("🗑️ Tab history cleared");
  }

  async exportHistory(): Promise<string> {
    if (!this.initialized) await this.initialize();
    
    const entries = Array.from(this.historyCache.values());
    return JSON.stringify(entries, null, 2);
  }

  async importHistory(jsonData: string): Promise<void> {
    try {
      const entries: TabHistoryEntry[] = JSON.parse(jsonData);
      for (const entry of entries) {
        if (entry.url && entry.lastAccessed) {
          this.historyCache.set(entry.url, entry);
        }
      }
      await this.persistHistory();
      console.log(`📥 Imported ${entries.length} tab history entries`);
    } catch (error) {
      console.error("Failed to import tab history:", error);
      throw error;
    }
  }

  // Get statistics about tab usage
  getStatistics(): {
    totalTabs: number;
    mostAccessed: TabHistoryEntry | null;
    oldestAccess: Date | null;
    newestAccess: Date | null;
  } {
    const entries = Array.from(this.historyCache.values());
    
    if (entries.length === 0) {
      return {
        totalTabs: 0,
        mostAccessed: null,
        oldestAccess: null,
        newestAccess: null
      };
    }
    
    const mostAccessed = entries.reduce((max, entry) => 
      entry.accessCount > max.accessCount ? entry : max
    );
    
    const times = entries.map(e => e.lastAccessed);
    const oldestTime = Math.min(...times);
    const newestTime = Math.max(...times);
    
    return {
      totalTabs: entries.length,
      mostAccessed,
      oldestAccess: new Date(oldestTime),
      newestAccess: new Date(newestTime)
    };
  }
}

// Global instance
export const tabHistoryManager = new TabHistoryManager();
