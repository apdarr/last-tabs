#!/bin/bash

echo "🧪 Testing Chrome Extension Tab Tracking"
echo ""

echo "1. 📊 Current data file contents:"
if [ -f ~/.raycast-last-tabs.json ]; then
    cat ~/.raycast-last-tabs.json | jq . 2>/dev/null || cat ~/.raycast-last-tabs.json
else
    echo "   ❌ No data file found"
fi

echo ""
echo "2. 🔄 Now switch between a few tabs in Chrome..."
echo "   (Wait 3 seconds between switches)"
echo ""

# Wait and check for changes
for i in {1..10}; do
    echo -n "   Checking... ($i/10) "
    
    if [ -f ~/.raycast-last-tabs.json ]; then
        # Get the lastUpdated timestamp
        current_time=$(cat ~/.raycast-last-tabs.json | jq '.lastUpdated' 2>/dev/null || echo "0")
        tab_count=$(cat ~/.raycast-last-tabs.json | jq '.tabs | length' 2>/dev/null || echo "0")
        echo "| ${tab_count} tabs | Updated: ${current_time}"
    else
        echo "| No file yet"
    fi
    
    sleep 3
done

echo ""
echo "3. 📋 Final data file contents:"
if [ -f ~/.raycast-last-tabs.json ]; then
    cat ~/.raycast-last-tabs.json | jq . 2>/dev/null || cat ~/.raycast-last-tabs.json
else
    echo "   ❌ Still no data file found"
fi

echo ""
echo "📝 If you didn't see changes:"
echo "   1. Go to chrome://extensions/"
echo "   2. Find 'Last Tabs Tracker'"
echo "   3. Click 'Inspect views: background page'"
echo "   4. Look at the console output while switching tabs"
echo "   5. Check for any error messages"
