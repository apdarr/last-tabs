#!/usr/bin/env node

// Simple script that Chrome extension can call to save tab data
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_FILE = path.join(os.homedir(), '.raycast-last-tabs.json');

// Read from stdin
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    input += chunk;
  }
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Tab data saved successfully');
  } catch (error) {
    console.error('Error saving tab data:', error.message);
    process.exit(1);
  }
});
