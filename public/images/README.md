# Image Assets for SunsetWell

## Directory Structure

```
/public/images/
├── hero/           # Homepage and landing page heroes
├── features/       # Feature section images
├── about/          # About page images
└── README.md       # This file
```

## Adding Hero Images

### Step 1: Source Images
See `/docs/PHOTO-STYLE-GUIDE.md` for photography guidelines.

Recommended sources:
- Unsplash: https://unsplash.com/s/photos/senior-friends-sunset
- Pexels: https://pexels.com/search/elderly-sunset

### Step 2: Optimize Images
Use tools like:
- **Squoosh** (https://squoosh.app) - Web-based image optimizer
- **ImageOptim** (Mac) - Drag and drop optimization
- **TinyPNG** - PNG/JPG compression

Target specs:
- Format: WebP (with JPG fallback)
- Size: < 200KB
- Dimensions: 1920x1080px

### Step 3: Add to Project
```bash
# Place optimized images here:
/public/images/hero/homepage-hero.webp
/public/images/hero/homepage-hero.jpg
```

### Step 4: Update Component
```tsx
// In src/app/page.tsx, replace placeholder gradient:
<Image
  src="/images/hero/homepage-hero.webp"
  alt="Seniors enjoying sunset together"
  fill
  priority
  className="object-cover"
/>
```

## Current Status
- ✅ Directory structure created
- ⏳ Hero images needed (see style guide)
- ⏳ Feature images needed
