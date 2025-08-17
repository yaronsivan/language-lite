#!/bin/bash
# Switch extension to production mode

echo "Switching extension to PRODUCTION mode..."

# Create production manifest
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Language Lite - Text Adapter",
  "version": "1.0.0",
  "description": "Adapt any text to your reading level instantly",
  "permissions": [
    "activeTab",
    "contextMenus",
    "storage",
    "scripting",
    "notifications"
  ],
  "host_permissions": [
    "https://language-lite.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon-16.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  },
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  }
}
EOF

echo "✅ Extension is now in PRODUCTION mode"
echo "📝 Using https://language-lite.com as API base URL"
echo ""
echo "To switch to development, run: ./use-dev.sh"