// Content script - minimal, just for page visibility tracking

// Track when page becomes visible/hidden
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible, notify background script
    try {
      chrome.runtime.sendMessage({
        action: 'pageVisible',
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    } catch (error) {
      // Ignore errors if extension context is invalidated
    }
  }
});

// Track focus events
window.addEventListener('focus', () => {
  try {
    chrome.runtime.sendMessage({
      action: 'pageVisible',
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });
  } catch (error) {
    // Ignore errors if extension context is invalidated
  }
});

// Initial page load
if (document.readyState === 'complete') {
  try {
    chrome.runtime.sendMessage({
      action: 'pageVisible',
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });
  } catch (error) {
    // Ignore errors if extension context is invalidated
  }
} else {
  window.addEventListener('load', () => {
    try {
      chrome.runtime.sendMessage({
        action: 'pageVisible',
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    } catch (error) {
      // Ignore errors if extension context is invalidated
    }
  });
}
