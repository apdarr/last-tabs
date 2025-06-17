#!/usr/bin/env node

// Native messaging host for Chrome extension to communicate with Raycast
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_FILE = path.join(os.homedir(), '.raycast-last-tabs.json');

// Native messaging protocol
process.stdin.on('readable', () => {
  let input = '';
  let chunk;
  
  while ((chunk = process.stdin.read()) !== null) {
    input += chunk;
  }
  
  if (input) {
    try {
      // Read the length of the message (first 4 bytes)
      const messageLength = input.readUInt32LE(0);
      const messageData = input.slice(4, 4 + messageLength).toString();
      const message = JSON.parse(messageData);
      
      handleMessage(message);
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
});

function handleMessage(message) {
  if (message.action === 'saveTabHistory') {
    try {
      const dataToSave = {
        tabs: message.tabs || [],
        lastUpdated: Date.now()
      };
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  } else if (message.action === 'getTabHistory') {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        sendResponse(data);
      } else {
        sendResponse({ tabs: [], lastUpdated: 0 });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
}

function sendResponse(response) {
  const message = JSON.stringify(response);
  const length = Buffer.byteLength(message);
  const buffer = Buffer.alloc(4 + length);
  
  buffer.writeUInt32LE(length, 0);
  buffer.write(message, 4);
  
  process.stdout.write(buffer);
}

// Handle process termination
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
