#!/bin/bash

# Optimize hero images using macOS sips tool
# Target: Max width 1920px, 85% quality, progressive JPEG

HERO_DIR="public/images/hero"
BACKUP_DIR="public/images/hero-originals"

echo "🖼️  Optimizing hero images..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Copy originals to backup if not already backed up
if [ ! -f "$BACKUP_DIR/hero-1.jpg" ]; then
  echo "📦 Backing up original images..."
  cp -r "$HERO_DIR"/* "$BACKUP_DIR/"
fi

# Process each image
for img in "$HERO_DIR"/*.jpg; do
  if [ -f "$img" ]; then
    filename=$(basename "$img")
    echo ""
    echo "Processing: $filename"

    # Get current dimensions
    width=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')
    height=$(sips -g pixelHeight "$img" | tail -1 | awk '{print $2}')
    size_before=$(ls -lh "$img" | awk '{print $5}')

    echo "  Original: ${width}x${height} ($size_before)"

    # Resize if wider than 1920px
    if [ "$width" -gt 1920 ]; then
      echo "  Resizing to max width 1920px..."
      sips -Z 1920 "$img" --out "$img" > /dev/null 2>&1
    fi

    # Set format to JPEG with 85% quality
    sips -s format jpeg -s formatOptions 85 "$img" --out "$img" > /dev/null 2>&1

    # Get new size
    new_width=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')
    new_height=$(sips -g pixelHeight "$img" | tail -1 | awk '{print $2}')
    size_after=$(ls -lh "$img" | awk '{print $5}')

    echo "  Optimized: ${new_width}x${new_height} ($size_after)"
  fi
done

echo ""
echo "✅ Image optimization complete!"
echo ""
echo "Before/After sizes:"
ls -lh "$HERO_DIR"/*.jpg | awk '{print $9, $5}'
