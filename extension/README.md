# Language Lite Chrome Extension

## Overview
This Chrome extension allows users to adapt any text on the web to their reading level using Language Lite's AI-powered adaptation system.

## Features
- Select text on any webpage and adapt it instantly
- Floating 📚 button appears near selected text
- Sidebar shows original and adapted text with vocabulary
- Context menu integration (right-click → "Adapt with Language Lite")
- Saves language and level preferences

## How It Works
1. **Text Selection**: User selects text on any webpage
2. **API Call**: Extension sends text to your Next.js backend (`/api/adapt`)
3. **Processing**: Backend uses your existing agent orchestrator
4. **Display**: Results shown in elegant sidebar

## Installation (Development)
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `/extension` folder
5. The extension is now installed!

## Testing
1. Make sure your Next.js app is running (`npm run dev`)
2. Go to any webpage with text
3. Select a paragraph of text
4. Click the 📚 button that appears
5. See the adapted text in the sidebar

## Authentication Flow
Currently simplified for demo:
- Extension expects auth token in chrome.storage
- In production, implement OAuth flow or token exchange

## API Integration
The extension communicates with your existing API:
- `POST /api/adapt` - Main text adaptation endpoint
- `GET /api/auth/verify` - Token verification

## Configuration
Update `API_BASE_URL` in:
- `popup.js`
- `background.js`

Change from `http://localhost:3000` to `https://language-lite.com` for production.

## Next Steps for Production
1. Implement proper authentication flow
2. Add error handling and retry logic
3. Implement caching for repeated texts
4. Add user settings sync
5. Create onboarding flow
6. Add analytics tracking
7. Optimize for performance
8. Add offline support (optional)

## Publishing to Chrome Web Store
1. Create a developer account
2. Package the extension as .zip
3. Upload to Chrome Web Store
4. Add store listing details
5. Submit for review