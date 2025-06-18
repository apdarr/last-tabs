# Last Tabs - Chrome Extension + Raycast Integration

This project consists of two parts:
1. A Chrome extension that tracks your tab activity in real-time
2. A Raycast extension that displays your most recently accessed tabs

## Setup Instructions

### 1. Install the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension should now be installed and tracking your tab activity

### 2. Start the Tab Tracking Server

For tab data storage, start the local server that receives data from Chrome:

```bash
cd chrome-extension
node tab-server.js
```

This will start a server on `http://127.0.0.1:8987` that receives tab data from the Chrome extension.

### 3. Install/Update the Raycast Extension

The Raycast extension will read tab data from `~/.raycast-last-tabs.json`:

```bash
npm run dev
```

## How It Works

1. **Chrome Extension**: Tracks tab activation and URL changes (not page loads)
2. **Smart Filtering**: Excludes the currently active tab from the history list
3. **Tab Focusing**: Uses AppleScript to focus existing tabs and activate Chrome
4. **Data Storage**: Tab data is sent to a local HTTP server that writes to `~/.raycast-last-tabs.json`
5. **Raycast Extension**: Reads the JSON file with stale-while-revalidate caching
6. **Quick Access**: First item in list is always your "previous" tab, perfect for quick switching

## Features

- **Real-time tracking**: Every tab switch is immediately recorded
- **Smart ordering**: Most recent tabs first, **excluding the current active tab**
- **Instant response**: Uses stale-while-revalidate caching for immediate tab display
- **Works from any app**: Activates Chrome and focuses the correct tab even when in other applications
- **Auto-refresh**: Fresh data loaded automatically when opening Raycast
- **Quick switching**: Perfect for bouncing between your last 2-3 tabs
- **No duplicates**: Same URL moves to top, no repeats
- **Persistent history**: Survives browser restarts
- **Favicon support**: Shows website icons when available
- **Time stamps**: See when each tab was last accessed
- **Clean interface**: Numbered list with quick access actions

## Data Format

The JSON file contains:
```json
{
  "tabs": [
    {
      "id": 123,
      "title": "Page Title",
      "url": "https://example.com",
      "lastAccessed": 1703097600000,
      "favIconUrl": "https://example.com/favicon.ico"
    }
  ],
  "lastUpdated": 1703097600000
}
```

## Chrome Extension Features

- **Popup Interface**: Click the extension icon to see current tracked tabs
- **Clear History**: Reset your tab history anytime
- **Background Tracking**: Works even when popup is closed
- **Efficient Storage**: Limits to 50 most recent tabs

## Raycast Extension Features

- **Quick Access**: `⌘ + Space` → "last tabs"
- **Open/Focus**: Press Enter to focus existing tab or open new one
- **Copy Actions**: `⌘ + C` for URL, `⌘ + Shift + C` for title
- **Visual Indicators**: Position number and last access time
- **Empty State**: Helpful guidance when no tabs are tracked

## Troubleshooting

1. **No tabs showing in Raycast**: 
   - Make sure Chrome extension is installed and active
   - Check if `~/.raycast-last-tabs.json` exists
   - Restart the tab server if running

2. **Chrome extension not tracking**:
   - Check Chrome DevTools console for errors
   - Verify extension has proper permissions
   - Try reloading the extension

3. **Server connection issues**:
   - The server is required for tab data storage
   - Make sure port 8987 is not blocked
   - Check server logs for errors
   - Run the server using the setup script `./setup.sh`

4. **Tab focusing not working**:
   - Make sure Chrome is installed and running
   - Grant necessary permissions to Raycast when prompted for AppleScript execution
   - Check that the URLs match exactly (AppleScript looks for exact URL matches)

## Development

To modify the Chrome extension:
1. Make changes to files in `chrome-extension/`
2. Go to `chrome://extensions/`
3. Click the reload button for "Last Tabs Tracker"

To modify the Raycast extension:
1. Make changes to files in `src/`
2. Run `npm run dev` to test changes