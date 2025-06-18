#!/bin/bash

echo "🧪 Last Tabs System Test"
echo "========================="

echo "1. 📊 Checking server status..."
if curl -s http://localhost:8987/health > /dev/null; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server is not running"
    echo "   Start with: cd chrome-extension && node tab-server.js"
fi

echo ""
echo "2. 📁 Current data file:"
if [ -f ~/.raycast-last-tabs.json ]; then
    echo "   ✅ Data file exists"
    echo "   📊 Contents:"
    cat ~/.raycast-last-tabs.json | jq . 2>/dev/null || cat ~/.raycast-last-tabs.json
else
    echo "   ❌ Data file does not exist"
fi

echo ""
echo "3. 🌐 Testing Chrome extension communication..."
echo "   📤 Sending test data to server..."
curl -s -X POST http://localhost:8987/tabs \
    -H "Content-Type: application/json" \
    -d '{
        "tabs": [
            {
                "id": 123,
                "title": "Test Tab",
                "url": "https://example.com",
                "lastAccessed": '$(date +%s%3N)',
                "favIconUrl": "https://example.com/favicon.ico"
            }
        ],
        "lastUpdated": '$(date +%s%3N)',
        "excludedCurrentTab": "https://current-tab.com"
    }'

echo ""
echo "   📁 Data file after test:"
cat ~/.raycast-last-tabs.json | jq . 2>/dev/null || cat ~/.raycast-last-tabs.json

echo ""
echo "4. 🎯 Testing Raycast extension focus functionality..."
echo "   (This requires manual testing in Raycast)"

echo ""
echo "✅ System test complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Chrome extension is loaded and enabled"
echo "2. Switch between tabs in Chrome to generate data"
echo "3. Open Raycast and test the 'Last Tabs' command"
echo "4. Try focusing a tab from Raycast"
