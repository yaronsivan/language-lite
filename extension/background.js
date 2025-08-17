// Background service worker - handles extension-wide events

const API_BASE_URL = 'http://localhost:3000'; // Change to https://language-lite.com for production

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: 'adaptText',
    title: 'Adapt with Language Lite',
    contexts: ['selection']
  });
  
  console.log('Language Lite extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', { menuItemId: info.menuItemId, hasSelection: !!info.selectionText });
  
  if (info.menuItemId === 'adaptText' && info.selectionText) {
    console.log('Starting context menu adaptation for:', info.selectionText.substring(0, 50));
    // Send message to content script to show sidebar with adapted text
    adaptTextFromContextMenu(info.selectionText, tab.id);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'adaptText') {
    console.log('Adapting text from content script:', request.text?.substring(0, 50));
    adaptText(request.text, sender.tab.id).then(result => {
      console.log('Adaptation result:', result);
      sendResponse(result);
    }).catch(error => {
      console.error('Adaptation error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

// Adapt text using the API
async function adaptText(text, tabId) {
  try {
    console.log('adaptText called with:', { textLength: text?.length, tabId });
    
    // Get auth token and user preferences
    const { authToken, motherTongue } = await chrome.storage.local.get(['authToken', 'motherTongue']);
    const { level } = await chrome.storage.sync.get(['level']);
    
    // Auto-detect page language
    let pageLanguage = null;
    try {
      const result = await chrome.tabs.sendMessage(tabId, { action: 'detectPageLanguage' });
      pageLanguage = result?.language;
    } catch (error) {
      console.log('Could not detect page language:', error);
    }
    
    // Fallback to user's manual selection if auto-detection fails
    if (!pageLanguage) {
      const { language: manualLanguage } = await chrome.storage.sync.get(['language']);
      pageLanguage = manualLanguage || 'Spanish';
      console.log('Using manual language selection:', pageLanguage);
    } else {
      console.log('Auto-detected page language:', pageLanguage);
    }
    
    console.log('Auth check:', { 
      hasToken: !!authToken, 
      pageLanguage, 
      level: level || 'Beginner',
      motherTongue: motherTongue || 'English'
    });
    
    if (!authToken) {
      console.log('No auth token, returning error');
      return { success: false, error: 'Not authenticated' };
    }
    
    // Call API
    console.log('Making API call to:', `${API_BASE_URL}/api/adapt`);
    const response = await fetch(`${API_BASE_URL}/api/adapt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        text: text,
        language: pageLanguage,
        level: level || 'Beginner',
        motherTongue: motherTongue || 'English'
      })
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      
      if (response.status === 402) {
        // No credits remaining
        throw new Error(errorData.error || 'No credits remaining');
      } else if (response.status === 401) {
        // Authentication failed
        throw new Error('Authentication failed. Please reconnect the extension.');
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    }
    
    const data = await response.json();
    console.log('API response data:', data);
    console.log('Credits remaining after adaptation:', data.creditsRemaining);
    
    // Send adapted text to content script
    chrome.tabs.sendMessage(tabId, {
      action: 'showAdaptedText',
      adaptedText: data.adaptedText,
      vocabulary: data.vocabulary,
      detectedLanguage: pageLanguage
    });
    
    return { success: true, adaptedText: data.adaptedText, vocabulary: data.vocabulary };
  } catch (error) {
    console.error('Error adapting text:', error);
    return { success: false, error: error.message };
  }
}

// Adapt text from context menu
async function adaptTextFromContextMenu(text, tabId) {
  try {
    console.log('adaptTextFromContextMenu called with:', { textLength: text?.length, tabId });
    
    // First hide any floating button and show loading sidebar
    try {
      chrome.tabs.sendMessage(tabId, { 
        action: 'hideFloatingButton'
      });
      chrome.tabs.sendMessage(tabId, { 
        action: 'showLoadingSidebar',
        originalText: text 
      });
      console.log('Sent hideFloatingButton and showLoadingSidebar messages');
    } catch (error) {
      // Content script not loaded, inject it
      console.log('Content script not loaded, injecting...', error);
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      
      // Also inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content.css']
      });
      
      // Small delay to ensure scripts are loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now try to hide button and show loading sidebar again
      chrome.tabs.sendMessage(tabId, { 
        action: 'hideFloatingButton'
      });
      chrome.tabs.sendMessage(tabId, { 
        action: 'showLoadingSidebar',
        originalText: text 
      });
      console.log('Sent hideFloatingButton and showLoadingSidebar messages after injection');
    }
    
    const result = await adaptText(text, tabId);
    
    if (!result.success) {
      // Show error notification (with proper parameters)
      chrome.notifications.create('adapt-error', {
        type: 'basic',
        iconUrl: 'icon-48.png',
        title: 'Language Lite',
        message: 'Failed to adapt text. Please check your connection and try again.'
      });
    }
  } catch (error) {
    console.error('Context menu adaptation error:', error);
    chrome.notifications.create('adapt-page-error', {
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'Language Lite',
      message: 'Error: Could not adapt text on this page.'
    });
  }
}

// Listen for auth token from web app
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAuthToken' && request.token) {
    const dataToStore = { authToken: request.token };
    
    // Also store mother tongue if provided
    if (request.motherTongue) {
      dataToStore.motherTongue = request.motherTongue;
      console.log('Storing user preferences:', { motherTongue: request.motherTongue });
    }
    
    chrome.storage.local.set(dataToStore, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Content script is already injected via manifest, but this is here for dynamic injection if needed
  }
});