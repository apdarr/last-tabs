# Changelog

All notable changes to the Last Active Tabs extension will be documented in this file.

## [2.0.0] - 2025-06-19

### 🚀 Major Rewrite - Native Raycast Integration

**Breaking Changes:**
- Complete rewrite to use native Raycast APIs instead of external dependencies
- No longer requires Chrome extension or local server setup
- Data storage migrated from file system to Raycast LocalStorage

**New Features:**
- ✨ **Multi-Browser Support**: Native support for Chrome, Safari, and Arc browsers
- 🎯 **Smart Tab Detection**: Automatically detects which browser a tab belongs to
- 📱 **Raycast Lifecycle Integration**: Records tab access on app open/close events  
- 💾 **Persistent LocalStorage**: Uses Raycast's built-in storage for better performance
- 🔄 **Real-time AppleScript Integration**: Direct browser communication without extensions
- 📊 **Enhanced Tab Ranking**: Combines access frequency with recency for better sorting
- 🧹 **History Management**: Built-in controls to clear and manage tab history

**Improved User Experience:**
- 🚀 **Zero Configuration**: Works out of the box with no setup required
- ⚡ **Better Performance**: Native Raycast integration eliminates external dependencies
- 🎨 **Enhanced UI**: Improved accessibility indicators and visual feedback
- ⌨️ **More Shortcuts**: Added shortcuts for history management and debugging

**Developer Experience:**
- 🏗️ **Modular Architecture**: Clean separation of concerns with dedicated utilities
- 🔧 **Better Error Handling**: Comprehensive error handling and logging
- 📚 **Type Safety**: Full TypeScript integration with Raycast utilities
- 🧪 **Easier Testing**: Simplified architecture makes testing more straightforward

**Migration Guide:**
- Existing Chrome extension data is automatically imported
- Chrome extension remains optional for additional accuracy
- All data is migrated to Raycast LocalStorage
- No action required from users - migration happens automatically

### Technical Details

**New Components:**
- `browser-tabs.ts`: AppleScript integration for multi-browser tab fetching
- `tab-history.ts`: Advanced history management with LocalStorage
- `tab-actions.ts`: Smart cross-browser tab focusing
- `refresh-handler.ts`: Raycast lifecycle integration

**Dependencies Updated:**
- Added `@raycast/utils` for AppleScript and LocalStorage support
- Removed dependency on external Chrome extension
- Simplified build process

**Browser Support:**
- Google Chrome: Full AppleScript integration
- Safari: Full AppleScript integration  
- Arc: Native Arc AppleScript support with proper tab IDs
- Automatic browser detection and fallback handling

## [1.x.x] - Previous Versions

### Legacy Chrome Extension Architecture
- Required Chrome extension installation
- Used local HTTP server for data storage
- File-based storage in `~/.raycast-last-tabs.json`
- Limited to Chrome browser only
- Manual setup and configuration required

---

## Upgrade Instructions

### From v1.x to v2.0

1. **Automatic Migration**: Your existing tab history will be automatically imported
2. **Chrome Extension**: Can be disabled - no longer required but still supported
3. **No Configuration**: Remove any manual setup steps - everything works automatically
4. **Multi-Browser**: Start using Safari and Arc alongside Chrome
5. **Better Performance**: Enjoy faster load times and better responsiveness

### Compatibility

- **macOS**: Required (AppleScript dependency)
- **Raycast**: v1.50.0 or later recommended
- **Browsers**: Chrome, Safari, Arc (automatically detected)
- **Permissions**: Browser accessibility permissions may be required

---

*This extension now leverages the full power of the Raycast ecosystem for a seamless, native experience.*