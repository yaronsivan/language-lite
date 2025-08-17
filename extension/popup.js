// Popup script - handles extension popup interactions

const API_BASE_URL = 'https://language-lite.com';

// Load saved preferences and auth state
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await loadPreferences();
  
  // Set up event listeners
  document.getElementById('adapt-btn').addEventListener('click', adaptCurrentText);
  document.getElementById('open-app').addEventListener('click', openApp);
  document.getElementById('login-btn')?.addEventListener('click', openApp);
  document.getElementById('manual-token-btn')?.addEventListener('click', handleManualToken);
  document.getElementById('language').addEventListener('change', savePreferences);
  document.getElementById('level').addEventListener('change', savePreferences);
  document.getElementById('mother-tongue').addEventListener('change', savePreferences);
  
  // User menu functionality
  document.getElementById('user-menu-trigger').addEventListener('click', toggleUserMenu);
  document.getElementById('language-settings-btn').addEventListener('click', toggleLanguageSettings);
  document.getElementById('language-settings-close').addEventListener('click', closeLanguageSettings);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-right')) {
      closeUserMenu();
    }
  });
});

// Check if user is authenticated
async function checkAuthStatus() {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    
    if (!authToken) {
      showLoginPrompt();
      return false;
    }
    
    // Verify token is still valid
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      showLoginPrompt();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    showLoginPrompt();
    return false;
  }
}

// Show login prompt
function showLoginPrompt() {
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('login-prompt').style.display = 'block';
}

// Load user preferences
async function loadPreferences() {
  const { language, level, motherTongue } = await chrome.storage.local.get(['language', 'level', 'motherTongue']);
  const syncData = await chrome.storage.sync.get(['language', 'level']);
  
  // Use local storage data first, fallback to sync storage
  const finalLanguage = language || syncData.language || 'Spanish';
  const finalLevel = level || syncData.level || 'Beginner';
  const finalMotherTongue = motherTongue || 'English';
  
  if (finalLanguage) {
    document.getElementById('language').value = finalLanguage;
    document.getElementById('detected-language').textContent = finalLanguage;
  }
  if (finalLevel) {
    document.getElementById('level').value = finalLevel;
    document.getElementById('current-level').textContent = finalLevel;
  }
  if (finalMotherTongue) {
    document.getElementById('mother-tongue').value = finalMotherTongue;
    document.getElementById('current-mother-tongue').textContent = finalMotherTongue;
  }
  
  await loadCreditsDisplay();
}

// Save user preferences
async function savePreferences() {
  const language = document.getElementById('language').value;
  const level = document.getElementById('level').value;
  const motherTongue = document.getElementById('mother-tongue').value;
  
  // Save to both local and sync storage
  await chrome.storage.local.set({ language, level, motherTongue });
  await chrome.storage.sync.set({ language, level });
  
  // Update the description text
  document.getElementById('detected-language').textContent = language;
  document.getElementById('current-level').textContent = level;
  document.getElementById('current-mother-tongue').textContent = motherTongue;
}

// Adapt the currently selected text
async function adaptCurrentText() {
  const adaptBtn = document.getElementById('adapt-btn');
  const adaptText = document.getElementById('adapt-text');
  
  try {
    // Show loading state
    adaptBtn.disabled = true;
    adaptText.innerHTML = '<span class="loading"></span>Adapting...';
    
    // First try to get stored selected text (works even when popup is open)
    const { lastSelectedText } = await chrome.storage.local.get('lastSelectedText');
    
    let textToAdapt = lastSelectedText;
    
    // If no stored text, try to get from content script
    if (!textToAdapt) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Use Promise wrapper to handle the callback properly
      textToAdapt = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
          resolve(response?.text || null);
        });
      });
    }
    
    if (!textToAdapt) {
      showError('Please select some text on the page first');
      resetButton();
      return;
    }
      
    // Get preferences
    const language = document.getElementById('language').value;
    const level = document.getElementById('level').value;
    
    // Get current tab for sending result back
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Show sidebar immediately with loading state
    chrome.tabs.sendMessage(tab.id, {
      action: 'showLoadingSidebar',
      originalText: textToAdapt
    });
    
    // Close popup so user can see the sidebar
    window.close();
    
    // Call API to adapt text
    try {
      const { authToken, motherTongue } = await chrome.storage.local.get(['authToken', 'motherTongue']);
      const apiResponse = await fetch(`${API_BASE_URL}/api/adapt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          text: textToAdapt,
          language: language,
          level: level,
          motherTongue: motherTongue || 'English'
        })
      });
        
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        
        if (apiResponse.status === 402) {
          throw new Error(errorData.error || 'No credits remaining');
        } else if (apiResponse.status === 401) {
          throw new Error('Authentication failed. Please reconnect the extension.');
        } else {
          throw new Error('Failed to adapt text');
        }
      }
      
      const data = await apiResponse.json();
      console.log('Credits remaining after adaptation:', data.creditsRemaining);
      
      // Send adapted text back to content script to show in sidebar
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAdaptedText',
        adaptedText: data.adaptedText,
        vocabulary: data.vocabulary
      });
      
      // Update credits display
      if (data.creditsRemaining !== undefined) {
        document.getElementById('credits-display').textContent = `${data.creditsRemaining} credits`;
      }
    } catch (error) {
      console.error('API error:', error);
      showError('Failed to adapt text. Please try again.');
      resetButton();
    }
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred. Please try again.');
    resetButton();
  }
}

// Reset button state
function resetButton() {
  const adaptBtn = document.getElementById('adapt-btn');
  const adaptText = document.getElementById('adapt-text');
  
  adaptBtn.disabled = false;
  adaptText.textContent = 'Adapt Selected Text';
}

// Show error message
function showError(message) {
  // Simple alert for now - could be improved with a toast notification
  alert(message);
}

// Open the main app
function openApp() {
  // Open the main app and show instructions
  chrome.tabs.create({ url: `${API_BASE_URL}/app` });
}

// Load and display user credits
async function loadCreditsDisplay() {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    
    if (!authToken) {
      document.getElementById('credits-display').textContent = '0 credits';
      return;
    }
    
    // Get user credits from API
    const response = await fetch(`${API_BASE_URL}/api/credits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('credits-display').textContent = `${data.credits} credits`;
    } else {
      document.getElementById('credits-display').textContent = '0 credits';
    }
  } catch (error) {
    console.error('Error loading credits:', error);
    document.getElementById('credits-display').textContent = '-- credits';
  }
}

// Toggle user menu
function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  menu.classList.toggle('show');
}

// Close user menu
function closeUserMenu() {
  const menu = document.getElementById('user-menu');
  menu.classList.remove('show');
}

// Toggle language settings
function toggleLanguageSettings() {
  const settings = document.getElementById('language-settings');
  settings.classList.toggle('show');
  closeUserMenu();
}

// Close language settings
function closeLanguageSettings() {
  const settings = document.getElementById('language-settings');
  settings.classList.remove('show');
}

// Handle logout
async function handleLogout() {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  window.location.reload();
}

// Handle manual token input
async function handleManualToken() {
  const tokenInput = document.getElementById('token-input');
  const inputText = tokenInput.value.trim();
  
  if (!inputText) {
    showError('Please paste the auth info');
    return;
  }
  
  try {
    let token, motherTongue;
    
    // Check if it's formatted text from clipboard
    if (inputText.includes('Token:') && inputText.includes('Mother Tongue:')) {
      // Parse formatted text
      const tokenMatch = inputText.match(/Token:\s*(.+?)(?:\n|$)/);
      const motherTongueMatch = inputText.match(/Mother Tongue:\s*(.+?)(?:\n|$)/);
      
      token = tokenMatch ? tokenMatch[1].trim() : null;
      motherTongue = motherTongueMatch ? motherTongueMatch[1].trim() : null;
      
      console.log('Parsed from formatted text:', { token: token?.substring(0, 20) + '...', motherTongue });
    } else {
      // Assume it's just a token
      token = inputText;
      motherTongue = null;
      console.log('Using as plain token:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      showError('Could not find token in the pasted text');
      return;
    }
    
    // Verify the token
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // Save the token and mother tongue
      const dataToStore = { authToken: token };
      if (motherTongue) {
        dataToStore.motherTongue = motherTongue;
      }
      
      await chrome.storage.local.set(dataToStore);
      
      console.log('Successfully stored auth data:', { hasToken: true, motherTongue });
      
      // Reload the popup to show authenticated state
      window.location.reload();
    } else {
      showError('Invalid token. Please try again.');
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    showError('Failed to verify token. Please try again.');
  }
}