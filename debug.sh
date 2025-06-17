#!/bin/bash

echo "🔍 Chrome Extension Debug Guide"
echo ""
echo "Let's check what's happening step by step:"
echo ""
echo "1. Check Chrome Extension Console:"
echo "   - Open Chrome DevTools (F12 or Cmd+Option+I)"
echo "   - Go to 'Console' tab"
echo "   - Look for messages starting with 'Tab history' or errors"
echo ""
echo "2. Check Extension Status:"
echo "   - Go to chrome://extensions/"
echo "   - Find 'Last Tabs Tracker'"
echo "   - Make sure it's enabled and has no errors"
echo ""
echo "3. Check Background Script:"
echo "   - On chrome://extensions/ page"
echo "   - Click 'Inspect views: background page' under the extension"
echo "   - This opens DevTools for the background script"
echo "   - Switch between tabs and watch for console messages"
echo ""
echo "4. Check Data File:"
echo "   - Run: cat ~/.raycast-last-tabs.json"
echo "   - Should update when you switch tabs"
echo ""
echo "5. Check Local Server (if running):"
echo "   - Server should show 'Saved X tabs' messages"
echo ""

echo "Running automatic checks..."
echo ""

# Check if extension data file exists
if [ -f ~/.raycast-last-tabs.json ]; then
    echo "✅ Data file exists at ~/.raycast-last-tabs.json"
    echo "📄 Current contents:"
    cat ~/.raycast-last-tabs.json | jq . 2>/dev/null || cat ~/.raycast-last-tabs.json
    echo ""
else
    echo "❌ No data file found at ~/.raycast-last-tabs.json"
    echo "   This means the Chrome extension isn't writing data"
    echo ""
fi

# Check if Chrome is running
if pgrep -f "Google Chrome" > /dev/null; then
    echo "✅ Chrome is running"
else
    echo "❌ Chrome doesn't appear to be running"
fi

echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Find 'Last Tabs Tracker' and click 'Inspect views: background page'"
echo "3. In the console that opens, switch between tabs"
echo "4. Look for messages like 'Tab history updated: X tabs'"
echo "5. If you see errors, copy them and share"
