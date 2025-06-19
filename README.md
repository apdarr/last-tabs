# Last Active Tabs - Raycast Extension

A smart Raycast extension that tracks and shows your most recently accessed browser tabs across Chrome, Safari, and Arc browsers using native AppleScript integration.

## Features

✨ **Multi-Browser Support**: Works with Chrome, Safari, and Arc browsers  
🎯 **Smart Tab Focusing**: Automatically detects which browser a tab belongs to and focuses it  
📊 **Intelligent Ranking**: Uses both access frequency and recency to rank tabs  
💾 **Persistent History**: Stores tab access history using Raycast LocalStorage  
🔄 **Automatic Sync**: Records tab access whenever Raycast opens/closes  
🚀 **Zero Configuration**: No browser extensions required - uses native AppleScript  

## How It Works

1. **Raycast Lifecycle Integration**: When you open Raycast, the extension records your current active tab and fetches all open tabs from supported browsers using AppleScript.

2. **Smart Ranking**: Tabs are ranked by:
   - **Last Access Time**: When you last looked at/focused a tab
   - **Access Frequency**: How often you visit a tab
   - **Recency Boost**: Recently accessed tabs (within the last hour) get priority

3. **Cross-Browser Tab Detection**: The extension automatically detects which browser a tab belongs to and can focus tabs across Chrome, Safari, and Arc seamlessly.

4. **History Persistence**: All tab access data is stored locally using Raycast's LocalStorage API and also integrates with any existing Chrome extension data for backward compatibility.

## Installation

1. Clone or download this repository
2. Open the folder in your terminal
3. Install dependencies: `npm install`
4. Build the extension: `npm run build`
5. Install in Raycast: `npm run publish` or manually import the built extension

## Usage

1. Open Raycast (`Cmd + Space`)
2. Type "Last tabs" or use your configured hotkey
3. Browse your recently accessed tabs, ranked by recency and frequency
4. Press Enter or click on a tab to focus it in its original browser
5. Use `Cmd + R` to manually refresh the tab list
6. Use `Cmd + Shift + Delete` to clear your tab history

## Keyboard Shortcuts

- **Enter**: Focus the selected tab
- **Cmd + C**: Copy tab URL
- **Cmd + Shift + C**: Copy tab title  
- **Cmd + R**: Refresh tab list
- **Cmd + Shift + Delete**: Clear tab history
- **Cmd + Shift + D**: Show debug information

## Browser Compatibility

### Supported Browsers
- **Google Chrome**: Full support including tab focusing
- **Safari**: Full support including tab focusing  
- **Arc**: Full support with native Arc tab IDs

### Browser Requirements
- Browsers must be running and have accessibility permissions
- No browser extensions required (pure AppleScript integration)

## Privacy & Data

- All data is stored locally on your machine using Raycast LocalStorage
- No data is sent to external servers
- Tab history can be cleared at any time
- Chrome extension integration is optional and provides additional accuracy

## Troubleshooting

### Tabs not appearing?
1. Make sure your browsers are running
2. Try refreshing with `Cmd + R`
3. Check that you have some browsing history (visit a few tabs first)

### Can't focus tabs?
1. Ensure browsers have accessibility permissions in macOS System Preferences
2. Check that the target browser is running
3. Try opening the URL manually as a fallback

### Performance issues?
1. Clear tab history with `Cmd + Shift + Delete` if it gets too large
2. The extension limits display to the top 20 most recent tabs for performance

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Lint and fix code
npm run fix-lint
```

## Architecture

The extension consists of several key components:

- **`browser-tabs.ts`**: AppleScript integration for fetching tabs from Chrome, Safari, and Arc
- **`tab-history.ts`**: Tab access tracking and history management using LocalStorage
- **`tab-actions.ts`**: Smart tab focusing across multiple browsers
- **`refresh-handler.ts`**: Raycast lifecycle integration and data synchronization
- **`last-tabs.tsx`**: Main UI component with smart filtering and ranking

## Migration from Chrome Extension

If you were using the previous version with a Chrome extension:

1. Your existing history data will be automatically imported
2. The Chrome extension will continue to work for additional accuracy
3. You can disable the Chrome extension - the new version works without it
4. All data will be migrated to Raycast LocalStorage for better performance

## Contributing

Feel free to submit issues and enhancement requests! This extension is designed to be lightweight and fast while providing smart tab management across all major browsers.

## License

MIT License - see LICENSE file for details.
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