#!/bin/bash
# Script to create placeholder icons for TabbyMcTabface
# Run this to generate basic icons until proper design is created

echo "Creating placeholder icons for TabbyMcTabface..."
echo "NOTE: These are temporary placeholders. Replace with proper designs before publishing!"

cd "$(dirname "$0")/icons"

# Create simple SVG placeholder
cat > icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#4285f4" rx="20"/>
  <text x="64" y="75" font-family="Arial, sans-serif" font-size="72" fill="white" text-anchor="middle" font-weight="bold">T</text>
  <text x="64" y="105" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">Tabby</text>
</svg>
EOF

echo "✓ Created icon.svg"
echo ""
echo "To convert to PNG icons (requires ImageMagick):"
echo "  convert icon.svg -resize 16x16 icon16.png"
echo "  convert icon.svg -resize 32x32 icon32.png"
echo "  convert icon.svg -resize 48x48 icon48.png"
echo "  convert icon.svg -resize 128x128 icon128.png"
echo ""
echo "Or use online converter: https://cloudconvert.com/svg-to-png"
echo ""
echo "⚠️  IMPORTANT: Replace these with professional icons before publishing!"
