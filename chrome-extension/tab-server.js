// Simple HTTP server to receive tab data from Chrome extension
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Queue of tab focus requests
let pendingFocusRequests = [];

const PORT = 8987; // Original port for tab tracking
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

  // Endpoint for polling tab focus requests
  if (req.method === 'GET' && req.url === '/focus-tab-poll') {
    if (pendingFocusRequests.length > 0) {
      const request = pendingFocusRequests.shift();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(request));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tabId: null }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/focus-tab') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tabId = data.tabId;
        if (typeof tabId !== 'number') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'tabId must be a number' }));
          return;
        }
        
        // Add to the queue of pending focus requests
        pendingFocusRequests.push({ tabId });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
        console.log(`Queued tab focus request for tabId: ${tabId}`);
      } catch (error) {
        console.error('Error processing focus-tab request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/tabs') {
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
