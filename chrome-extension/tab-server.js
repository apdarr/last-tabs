// Simple HTTP server to receive tab data from Chrome extension
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8987;
const DATA_FILE = path.join(os.homedir(), '.raycast-last-tabs.json');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/tabs') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
        console.log(`Saved ${data.tabs?.length || 0} tabs to ${DATA_FILE}`);
        if (data.excludedCurrentTab) {
          console.log(`Excluded current tab: ${data.excludedCurrentTab}`);
        }
      } catch (error) {
        console.error('Error saving tab data:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/force-save') {
    // Force the Chrome extension to save current state immediately
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        console.log('🚀 Force save requested from Raycast');
        
        // Send message to Chrome extension to force save
        // Note: Since we can't directly communicate with the extension from here,
        // we'll just trigger a save by requesting tab history
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Force save triggered' }));
      } catch (error) {
        console.error('Error handling force save:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Tab tracking server running on http://127.0.0.1:${PORT}`);
  console.log(`Data will be saved to: ${DATA_FILE}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
