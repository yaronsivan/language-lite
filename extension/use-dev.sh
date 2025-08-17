#!/bin/bash
# Switch extension to development mode

echo "Switching extension to DEVELOPMENT mode..."

# Copy dev manifest
cp manifest-dev.json manifest.json

echo "✅ Extension is now in DEVELOPMENT mode"
echo "📝 Using localhost:3000 as API base URL"
echo ""
echo "To switch to production, run: ./use-prod.sh"