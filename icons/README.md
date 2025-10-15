# TabbyMcTabface Icons

## Required Icon Sizes

You need to create icon files at these sizes:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Icon Design Guidelines

### Theme
- **Subject**: Tabby cat (orange/brown striped cat)
- **Expression**: Sassy, passive-aggressive, slightly annoyed
- **Style**: Modern, clean, recognizable at small sizes

### Design Elements
- **Colors**: Orange/brown fur with darker stripes
- **Expression**: Raised eyebrow or smirk
- **Optional**: Small tab icon/symbol incorporated
- **Background**: Transparent or solid color

### Design Tips
1. **Keep it simple**: Icon needs to be recognizable at 16x16
2. **High contrast**: Ensure it stands out against light/dark backgrounds
3. **Consistent**: Same design across all sizes, just different resolutions
4. **Professional**: Clean edges, anti-aliased

## How to Create Icons

### Option 1: Use Your Existing Icon
If you have an icon you want to use:
1. Export/save it at the required sizes (16, 32, 48, 128)
2. Name them `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
3. Place them in this `icons/` directory
4. Done!

### Option 2: AI Generation
Use AI image generators:
1. **Prompt**: "Sassy tabby cat icon, passive-aggressive expression, clean design, app icon style, transparent background"
2. **Tools**: DALL-E, Midjourney, Stable Diffusion
3. **Export** at 512x512, then resize to required sizes
4. Use image editor to create all sizes

### Option 3: Design Tools
Use design software:
- **Figma**: Free, web-based, great for icons
- **Adobe Illustrator**: Vector graphics (scales perfectly)
- **Sketch**: Mac-only design tool
- **Inkscape**: Free, open-source vector editor

### Option 4: Icon Libraries
Modify existing cat icons:
- [Flaticon](https://www.flaticon.com) - search "cat icon"
- [The Noun Project](https://thenounproject.com) - search "tabby cat"
- [Icons8](https://icons8.com) - search "cat"

**Important**: Check licenses! Ensure you have rights to use/modify.

## Resize Images

If you have a large icon and need to resize:

### Using macOS Preview
1. Open image in Preview
2. Tools → Adjust Size
3. Set width/height (maintain aspect ratio)
4. Export as PNG

### Using Online Tools
- [ResizeImage.net](https://resizeimage.net)
- [iloveimg.com](https://www.iloveimg.com/resize-image)

### Using Command Line (ImageMagick)
```bash
# Install ImageMagick
brew install imagemagick

# Resize to all sizes
convert your-icon.png -resize 16x16 icon16.png
convert your-icon.png -resize 32x32 icon32.png
convert your-icon.png -resize 48x48 icon48.png
convert your-icon.png -resize 128x128 icon128.png
```

## Quick Test

To test your icons:
1. Place them in this directory
2. Build the extension: `npm run build`
3. Load into Chrome
4. Check toolbar - does your icon look good?
5. Check `chrome://extensions` - does it look professional?

## Current Status

⚠️ **Icons not yet created**

Once you have your icons, place them here and they'll be automatically copied to `dist/icons/` during build.
