#!/bin/bash

# Language Lite Chrome Extension Packaging Script

echo "🚀 Packaging Language Lite Chrome Extension..."

# Create a temporary directory for the package
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="language-lite-extension-v1.0.0"

# Copy extension files to temp directory
echo "📁 Copying extension files..."
cp -r extension/* "$TEMP_DIR/"

# Remove development files
echo "🧹 Removing development files..."
rm -f "$TEMP_DIR/DISTRIBUTION.md"
rm -f "$TEMP_DIR/README.md"
rm -f "$TEMP_DIR/*.md"

# Create the zip package
echo "📦 Creating zip package..."
cd "$TEMP_DIR"
zip -r "../$PACKAGE_NAME.zip" . -x "*.DS_Store"

# Move the package to the project root
mv "../$PACKAGE_NAME.zip" "$OLDPWD/"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Extension packaged successfully!"
echo "📦 Package created: $PACKAGE_NAME.zip"
echo ""
echo "🏪 Ready for Chrome Web Store upload!"
echo "📖 See extension/DISTRIBUTION.md for publication guide"

# Show package contents
echo ""
echo "📋 Package contents:"
unzip -l "$PACKAGE_NAME.zip" | head -20