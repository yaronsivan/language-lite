// Extension configuration
// Set IS_PRODUCTION to true when building for Chrome Web Store

const IS_PRODUCTION = false; // Set to true for production build

const API_BASE_URL = IS_PRODUCTION 
  ? 'https://language-lite.com' 
  : 'http://localhost:3000';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_BASE_URL, IS_PRODUCTION };
}