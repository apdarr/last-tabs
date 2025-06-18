#!/bin/bash

echo "🚀 Setting up Last Tabs Chrome Extension + Raycast Integration"
echo ""

# Check if Chrome is installed
if ! command -v google-chrome &> /dev/null && ! command -v "Google Chrome" &> /dev/null; then
    echo "⚠️  Chrome not found. Please install Google Chrome first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Please install Node.js first."
    exit 1
fi

# Install dependencies for the Chrome extension server
echo "📦 Installing dependencies for tab server..."
cd chrome-extension || exit 1
npm install
cd .. || exit 1

# Make the tab server executable
chmod +x chrome-extension/tab-server.js

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Chrome Extension:"
echo "   - Open Chrome and go to chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked' and select: $(pwd)/chrome-extension"
echo ""
echo "2. Start the tab tracking server (required for tab focusing):"
echo "   cd chrome-extension && node tab-server.js"
echo ""
echo "3. Test the Raycast extension:"
echo "   npm run dev"
echo ""
echo "4. Start browsing! Your tab activity will be tracked automatically."
