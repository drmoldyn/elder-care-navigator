# Photo Style Guide for SunsetWell

## Brand Photography Guidelines

### Core Visual Identity
SunsetWell's photography should convey **warmth, dignity, joy, and hope** - showing the outcome of good care decisions, not the clinical process.

---

## Photography Standards

### ✅ DO Use:

**Lighting:**
- Golden hour photography (sunrise/sunset)
- Warm, soft natural light
- Backlit scenes with sun halos
- Gentle shadows

**Subjects:**
- Genuine, authentic expressions
- Active seniors (walking, laughing, engaging)
- Multi-generational connections
- Diverse representation (age, ethnicity, abilities)
- Groups of 2-4 people for connection

**Settings:**
- Outdoor natural environments
- Beaches, parks, gardens
- Soft-focus backgrounds
- Clean, uncluttered compositions

**Emotions:**
- Genuine laughter and smiles
- Warmth and connection
- Dignity and respect
- Hope and vitality

**Composition:**
- Rule of thirds
- Leading lines
- Natural framing
- Negative space for text overlay

### ❌ DON'T Use:

**Avoid:**
- Hospital beds as focal points
- Clinical/institutional settings
- Wheelchairs as primary subject
- Sadness, decline, or frailty
- Overly posed or "stock photo" fake smiles
- Harsh fluorescent lighting
- Cluttered backgrounds
- Isolation or loneliness

---

## Color Palette (Extracted from Photography)

```css
/* Primary Brand Colors */
--sunset-orange: #FF9B6A;    /* Warm, hopeful */
--sunset-gold: #FFD16A;      /* Optimistic */
--sky-blue: #6BA3C4;         /* Calm, trustworthy */
--lavender: #B4A5C7;         /* Gentle, dignified */
--teal-soft: #7DBBC3;        /* Refreshing */
--neutral-warm: #F5F1E8;     /* Comfortable */
```

---

## Hero Image Specifications

### Homepage Hero
- **Dimensions:** 1920x1080px minimum (16:9 aspect ratio)
- **File format:** WebP (with JPG fallback)
- **File size:** < 200KB optimized
- **Subject placement:** Leave center 50% clear for text overlay
- **Color treatment:** Warm tones (sunset/golden hour)

### Example Compositions:

**Homepage (Current):**
```
┌─────────────────────────────────────┐
│  [SENIORS LAUGHING - LEFT 30%]      │
│                                     │
│      SUNSETWELL.COM                 │
│      [Clear Center Space]           │
│      [CTA BUTTON]                   │
│                                     │
│      [SENIORS SMILING - RIGHT 30%]  │
└─────────────────────────────────────┘
```

**Results Page Header:**
```
┌─────────────────────────────────────┐
│  [SENIOR COUPLE SUNSET - FULL]      │
│  ├─ Semi-transparent overlay        │
│  └─ "We found X care options"       │
└─────────────────────────────────────┘
```

---

## Image Sources & Licensing

### Recommended Stock Photo Sites:
1. **Unsplash** (free, commercial use)
   - Search: "senior friends sunset", "elderly couple beach"

2. **Pexels** (free, commercial use)
   - Search: "aging well", "senior community"

3. **Adobe Stock** (paid)
   - Higher quality, more specific searches
   - "authentic senior lifestyle"

### AI-Generated Options:
- Midjourney prompts: "group of diverse seniors laughing together at sunset, golden hour photography, warm tones, genuine expressions, photorealistic --ar 16:9"
- DALL-E 3: Similar prompts focusing on warmth and authenticity

### Custom Photography:
- If budget allows, commission original photos
- Hire photographer specializing in lifestyle/documentary
- Shoot at actual care facilities (with releases)

---

## Technical Implementation

### File Structure:
```
/public/images/
├── hero/
│   ├── homepage-hero.webp
│   ├── homepage-hero.jpg (fallback)
│   ├── homepage-hero-mobile.webp
│   └── homepage-hero-mobile.jpg
├── features/
│   ├── care-facility-example.webp
│   └── home-health-example.webp
└── about/
    └── mission-hero.webp
```

### Next.js Image Component:
```tsx
<Image
  src="/images/hero/homepage-hero.webp"
  alt="Seniors enjoying sunset together"
  fill
  priority
  className="object-cover"
  sizes="100vw"
/>
```

### Gradient Overlays:
```tsx
{/* Ensures text readability over photos */}
<div className="absolute inset-0 bg-gradient-to-b
  from-transparent via-black/10 to-black/30" />
```

---

## Accessibility

### Alt Text Standards:
- ✅ **Good:** "Group of four diverse seniors laughing together at sunset on a beach"
- ❌ **Bad:** "Seniors", "Hero image"

### Text Contrast:
- White text on photos requires drop-shadow or gradient overlay
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Test with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Brand Consistency Checklist

Before publishing any photo, verify:
- [ ] Golden hour or warm lighting
- [ ] Genuine expressions (not overly posed)
- [ ] Diverse representation
- [ ] Clear center space for text (hero images)
- [ ] Optimized file size (< 200KB)
- [ ] WebP format with JPG fallback
- [ ] Proper alt text
- [ ] No clinical/institutional vibes

---

## Examples from Canva Designs

### Design #1 (Triptych)
- **Style:** Three connected panels showing different moments
- **Lighting:** Sunset backlit with warm golden tones
- **Subjects:** Multiple generations, genuine laughter
- **Composition:** Domain name overlay in center clear space
- **Use case:** Homepage hero, email headers

### Design #2 (Full Width)
- **Style:** Single full-width hero with navigation overlay
- **Lighting:** Dramatic sunset with silhouettes
- **Subjects:** Group of four seniors in profile/three-quarter view
- **Composition:** Left-aligned text, right side clear
- **Use case:** Landing pages, about page

---

## Roadmap

### Phase 1 (Current)
- ✅ CSS gradient placeholder
- ✅ Brand color palette defined
- ⏳ Source/commission hero photo

### Phase 2
- Find/create 3-5 hero images for rotation
- A/B test different images
- Add subtle parallax scroll effect

### Phase 3
- Custom photography at partner facilities
- Video backgrounds (subtle, optimized)
- Seasonal variations

---

Built with care for SunsetWell.com 🌅
