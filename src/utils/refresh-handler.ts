/**
 * Utility for handling data refresh in the tab extension
 * This helps ensure we have the most up-to-date tab information
 */

interface RefreshCallbacks {
  revalidateHistory: () => void;
  revalidateOpenTabs: () => void;
}

export class TabDataRefreshHandler {
  private callbacks: RefreshCallbacks | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  setCallbacks(callbacks: RefreshCallbacks) {
    this.callbacks = callbacks;
  }

  // Ping the Chrome extension server to check if it's running
  async pingServer(): Promise<boolean> {
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch('http://127.0.0.1:8987/health', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Tab server not responding:', error);
      return false;
    }
  }

  // Force refresh of all tab data
  async refreshAll(): Promise<void> {
    if (!this.callbacks) {
      console.warn('No refresh callbacks set');
      return;
    }

    console.log('🔄 Refreshing all tab data...');
    
    // Try to wake up the server
    await this.pingServer();
    
    // Small delay to let the server process any pending updates
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Refresh both data sources
    this.callbacks.revalidateHistory();
    this.callbacks.revalidateOpenTabs();
  }

  // Schedule a delayed refresh (useful after window close)
  scheduleDelayedRefresh(delayMs: number = 500): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      console.log('⏰ Executing scheduled refresh...');
      this.refreshAll();
    }, delayMs);
  }

  // Clean up any pending refreshes
  cleanup(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }
}

// Global instance for use across the extension
export const tabRefreshHandler = new TabDataRefreshHandler();
