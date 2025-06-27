/**
 * Utility for handling data refresh in the tab extension
 * Integrates with Raycast lifecycle and browser AppleScript APIs
 */

import { getAllBrowserTabs } from "./browser-tabs";
import { tabHistoryManager } from "./tab-history";

interface RefreshCallbacks {
  revalidateHistory: () => void;
  revalidateOpenTabs: () => void;
}

export class TabDataRefreshHandler {
  private callbacks: RefreshCallbacks | null = null;
  private isRefreshing = false;

  setCallbacks(callbacks: RefreshCallbacks) {
    this.callbacks = callbacks;
    console.log("🔧 Refresh handler callbacks configured");
  }

  // Note: We rely solely on Chrome extension for tab access tracking
  // This method is kept for potential future use but doesn't record access
  async recordCurrentActiveTab(): Promise<void> {
    try {
      console.log("📝 Checking current active tab (Chrome extension handles tracking)...");
      const allTabs = await getAllBrowserTabs();
      const activeTab = allTabs.find(tab => tab.active);
      
      if (activeTab) {
        console.log(`ℹ️ Current active tab: ${activeTab.title}`);
      } else {
        console.log("⚠️ No active tab found");
      }
    } catch (error) {
      console.error("❌ Failed to check active tab:", error);
    }
  }

  // Force Chrome extension to save current tab state (legacy support)
  async forceChromeSave(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:8987/force-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() })
      });
      
      if (response.ok) {
        console.log('✅ Chrome extension saved current state');
        return true;
      } else {
        console.log('⚠️ Chrome extension server responded but save failed');
        return false;
      }
    } catch (error) {
      console.log('📡 Chrome extension server not available, using native browser APIs');
      return false;
    }
  }

  // Immediate refresh - get latest data right now
  async refreshImmediate(): Promise<void> {
    if (this.isRefreshing) {
      console.log("🔄 Refresh already in progress, skipping...");
      return;
    }
    
    if (!this.callbacks) {
      console.warn('No refresh callbacks set');
      return;
    }

    this.isRefreshing = true;
    console.log('⚡ Immediate refresh starting...');
    
    try {
      // Record current active tab before refreshing data
      await this.recordCurrentActiveTab();
      
      // Legacy Chrome extension support (try, but don't block on failure)
      await this.forceChromeSave();
      
      // Refresh both data sources
      console.log('🔄 Refreshing tab data sources...');
      this.callbacks.revalidateOpenTabs(); // Browser tabs via AppleScript
      this.callbacks.revalidateHistory();  // History data
      
      console.log('✨ Refresh complete');
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  // When Raycast window opens - record current tab and refresh data
  async refreshOnOpen(): Promise<void> {
    console.log('👋 Raycast opened - recording current tab and refreshing');
    await this.refreshImmediate();
  }

  // When Raycast window closes - record current tab for next time
  async refreshOnClose(): Promise<void> {
    console.log('🚪 Raycast closing - recording final tab state');
    await this.recordCurrentActiveTab();
    
    // Don't revalidate UI components on close, just record data
    await this.forceChromeSave(); // Legacy support
  }
}

// Global instance for use across the extension
export const tabRefreshHandler = new TabDataRefreshHandler();
