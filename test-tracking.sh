#!/bin/bash

echo "🧪 Testing Chrome Extension Tab Tracking & Focusing"
echo ""

# Check if server is running
if ! curl -s http://127.0.0.1:8987/health > /dev/null; then
    echo "❌ Tab server is not running"
    echo "   Run: cd chrome-extension && node tab-server.js"
    echo ""
    echo "Continuing with partial tests..."
fi

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
for i in {1..5}; do
    echo -n "   Checking... ($i/5) "
    
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
    echo ""
    echo "📝 If you didn't see changes:"
    echo "   1. Go to chrome://extensions/"
    echo "   2. Find 'Last Tabs Tracker'"
    echo "   3. Click 'Inspect views: background page'"
    echo "   4. Look at the console output while switching tabs"
    echo "   5. Check for any error messages"
    exit 1
fi

# Test tab focusing if server is running
if curl -s http://127.0.0.1:8987/health > /dev/null; then
    echo ""
    echo "4. 🎯 Testing tab focusing..."
    echo ""
    
    # Get a tabId from the current data
    tabId=$(cat ~/.raycast-last-tabs.json | grep -o '"id":[0-9]*' | head -1 | cut -d ':' -f 2)

    if [ -z "$tabId" ]; then
        echo "   ❌ No tabId found in data file"
        echo "   Try switching between more tabs in Chrome"
        exit 1
    fi

    echo "   📊 Found tabId: $tabId"
    echo "   🔄 Sending focus request for this tab..."

    response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"tabId\": $tabId}" http://127.0.0.1:8987/focus-tab)

    if [[ "$response" == *"success"* ]]; then
        echo "   ✅ Tab focus request sent successfully"
        echo "   Check Chrome to see if a tab was focused"
    else
        echo "   ❌ Tab focus request failed with response:"
        echo "   $response"
    fi
fi

echo ""
echo "✅ Tests completed"
echo ""
echo "If you experienced issues, run ./debug.sh for more detailed diagnostics."
