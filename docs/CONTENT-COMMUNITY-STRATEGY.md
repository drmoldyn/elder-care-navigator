# Content & Community Strategy

## Vision: Stories-Driven Organic Growth

Build a trusted community where families share eldercare journeys, exchange advice, and support each other - while naturally discovering SunsetWell's facility matching.

---

## 1. Content Pillars

### A. Family Stories (User-Generated)
**Format:** First-person narratives (800-2000 words)

**Story Categories:**
- **The Search Journey** - "How we found the right memory care facility for Mom"
- **Transition Stories** - "Dad's first month in assisted living: what we learned"
- **Caregiving Challenges** - "Balancing work and caring for parents with dementia"
- **VA Benefits Success** - "How we navigated VA eldercare benefits"
- **Medicaid Planning** - "Our Medicaid spend-down journey"
- **End-of-Life Care** - "Choosing hospice: what I wish I'd known"
- **Cultural Perspectives** - "Finding culturally competent care for immigrant parents"

**SEO Value:**
- Long-tail keywords (e.g., "memory care facility northern Virginia reviews")
- Natural internal links to facility search
- User engagement signals (time on page, shares)
- Fresh content updates

**Monetization Tie-ins:**
- Inline facility recommendations matching story context
- Affiliate links to mentioned services (elder law, financial planning)
- "Request Info" CTAs contextual to story phase

### B. Expert Advice (Editorial)
**Format:** How-to guides, checklists, decision frameworks

**Topic Categories:**
- **Choosing Facilities** - "10 Questions to Ask on a Nursing Home Tour"
- **Financial Planning** - "Understanding Medicaid vs. Medicare Coverage"
- **Medical Conditions** - "Finding Specialized Dementia Care: A Guide"
- **Legal Issues** - "Power of Attorney: When and Why You Need It"
- **Caregiver Wellness** - "Avoiding Burnout: Self-Care for Family Caregivers"
- **Transition Planning** - "The First 30 Days Checklist: Assisted Living Move-In"

**SEO Value:**
- High-volume informational keywords
- Featured snippet optimization
- Pillar page strategy with topic clusters

### C. Community Q&A Forum
**Format:** Moderated discussion threads

**Sections:**
- General Caregiving Advice
- Facility Reviews & Recommendations
- Medical Conditions (Dementia, Mobility, etc.)
- Financial & Legal Questions
- Regional Discussions (by state/metro)

**Benefits:**
- Massive long-tail keyword coverage
- User-generated content at scale
- Community engagement = retention
- Natural facility discussion/reviews

---

## 2. Technical Implementation

### Option A: Headless CMS + Blog (Fastest)
**Stack:**
- **Content:** Contentful or Sanity CMS
- **Frontend:** Next.js App Router (`/blog`, `/stories`, `/community`)
- **Comments:** Disqus or Hyvor Talk (moderated)
- **Search:** Algolia for content discovery

**Timeline:** 1-2 weeks
**Pros:** Fast to launch, easy for non-technical writers
**Cons:** Monthly cost ($99-299/month), limited customization

### Option B: Supabase + Custom Blog (Full Control)
**Stack:**
- **Database:** Supabase (already using)
- **Tables:** `posts`, `post_categories`, `comments`, `authors`
- **Frontend:** Next.js with MDX support
- **Comments:** Custom-built with moderation queue
- **Search:** Postgres full-text search

**Timeline:** 2-3 weeks
**Pros:** Free (within Supabase limits), full control, user profiles integrate
**Cons:** More development time, moderation tools needed

### Recommended: **Option B (Supabase)**
**Why:**
- Already have Supabase infrastructure
- Can integrate with user accounts (future case manager portal)
- Full control over moderation, spam filtering
- No recurring CMS costs
- Community features (upvotes, saves, follows) easier to build

---

## 3. Database Schema (Supabase)

```sql
-- Blog posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- MDX or rich text JSON
  author_id UUID REFERENCES authors(id),
  category_id UUID REFERENCES post_categories(id),
  post_type TEXT CHECK (post_type IN ('story', 'guide', 'qa')),
  status TEXT CHECK (status IN ('draft', 'review', 'published')),
  featured_image_url TEXT,
  meta_description TEXT,
  keywords TEXT[], -- SEO keywords
  view_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post categories
CREATE TABLE post_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES post_categories(id), -- For nested categories
  seo_title TEXT,
  seo_description TEXT
);

-- Authors (can be staff or community members)
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('staff', 'community', 'expert')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id),
  parent_id UUID REFERENCES comments(id), -- For nested replies
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post tags (for cross-referencing)
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(post_id, tag)
);

-- Post analytics (for trending/popular sorting)
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER, -- seconds
  shares INTEGER DEFAULT 0,
  UNIQUE(post_id, date)
);
```

---

## 4. Content Routes & Pages

### Main Blog Routes
```
/blog                          → All posts (stories + guides)
/blog/stories                  → User stories only
/blog/guides                   → Expert guides only
/blog/category/[slug]          → Category archives
/blog/tag/[slug]               → Tag archives
/blog/[slug]                   → Individual post page
/community                     → Q&A forum
/community/[category]          → Forum category
/community/thread/[id]         → Discussion thread
/submit-story                  → User story submission form
/write                         → Staff/editor dashboard
```

### SEO Structure
```
Homepage → Blog Hub → Category Pages → Individual Posts
                   ↓
            Facility Search (contextual CTAs)
```

---

## 5. Content Acquisition Strategy

### Phase 1: Seed Content (Weeks 1-4)
**Goal:** 20-30 high-quality posts to establish authority

**Sources:**
1. **Staff-Written Guides** (10 posts)
   - Hire 1-2 freelance eldercare writers ($200-400/post)
   - Focus on high-volume keywords from Google Trends
   - Example: "How to Choose a Nursing Home: 12-Step Checklist"

2. **Solicited Stories** (10 posts)
   - Reach out to eldercare Facebook groups, Reddit (r/AgingParents)
   - Offer $100-200 gift cards for published stories
   - Light editing for readability, SEO

3. **Repurposed Content** (5-10 posts)
   - Transform facility data into "Best of" guides
   - Example: "Top 10 Memory Care Facilities in Phoenix (2025)"
   - Auto-generated with editorial oversight

### Phase 2: Community Contribution (Months 2-3)
**Goal:** Enable user submissions, build momentum

**Features:**
- "Share Your Story" submission form
- Moderation queue for staff review
- Author profiles (bio, photo, social links)
- "Published Author" badge for contributors

**Incentives:**
- Featured stories promoted on homepage
- Social media amplification (if we build channels)
- "Top Contributor" monthly recognition
- Exclusive caregiver resources (PDF guides, checklists)

### Phase 3: Scale & Automation (Months 4-6)
**Goal:** Sustainable content pipeline

**Tactics:**
- Email nurture asking for story submissions
- AI-assisted drafting (user provides outline, we polish)
- Partner with eldercare influencers for guest posts
- Webinar series → repurposed as blog posts

---

## 6. SEO & Content Distribution

### On-Page SEO
- **Structured Data:** `Article` schema on every post
- **Internal Linking:** Auto-suggest related facilities in content
- **Image Optimization:** Alt text, lazy loading, WebP format
- **Mobile-First:** Readable typography, proper spacing

### Off-Page SEO
- **Backlink Outreach:** Share stories with local news, eldercare orgs
- **Guest Posting:** Write for AgingCare.com, Caring.com (link back)
- **PR Opportunities:** Unique data insights from facility database

### Social Distribution (If/When Ready)
- **Facebook:** Eldercare groups, local community pages
- **Reddit:** r/AgingParents, r/dementia, r/caregivers
- **Pinterest:** Visual guides, checklists (drives traffic)
- **LinkedIn:** Professional caregivers, case managers

---

## 7. Monetization Integration

### Contextual Facility Recommendations
```markdown
<!-- In story content -->
"After touring five memory care facilities in Arlington, we chose
Sunrise Senior Living because..."

[Inline Widget]
📍 Memory Care Facilities in Arlington, VA
→ See 12 Medicare-certified options with availability
[View Matches →]
```

### Affiliate Partnerships
- **Elder Law Attorneys** - LegalZoom, Nolo
- **Financial Planning** - Medicaid planners, estate attorneys
- **Home Modifications** - Stairlifts, grab bars (Amazon Affiliates)
- **Medical Alert Systems** - Life Alert, Medical Guardian
- **Senior Moving Services** - Local/national movers

### Sponsored Content (Future)
- Facilities can sponsor related story promotion
- "Featured Partner" badges on relevant posts
- Native advertising clearly labeled

---

## 8. Moderation & Quality Control

### Content Guidelines
- **Authenticity:** Real stories only (verify via email)
- **Respectful Tone:** No facility bashing, constructive criticism OK
- **Privacy:** No patient names, protected health info
- **Accuracy:** Medical claims must cite sources

### Moderation Workflow
1. User submits story via form
2. Auto-save to `posts` table with `status: 'review'`
3. Email notification to moderation team
4. Staff editor reviews for:
   - Authenticity (reply to author email)
   - Tone/quality
   - SEO optimization (keywords, meta description)
   - Legal issues (HIPAA, defamation)
5. Publish or request revisions
6. Notify author when live

### Anti-Spam Measures
- reCAPTCHA v3 on submission forms
- Email verification required
- Manual review before first publish
- Comment moderation queue (approve/reject)

---

## 9. Analytics & Success Metrics

### Track with GTM + GA4
- **Engagement:** Avg. time on page, scroll depth
- **Conversions:** Blog readers → facility search (conversion funnel)
- **Top Content:** Most-viewed, most-shared stories
- **SEO Performance:** Organic traffic, keyword rankings
- **Community Health:** Comments per post, return visitors

### Goals (6 Months)
- **Traffic:** 10k monthly organic visitors from blog
- **Conversion Rate:** 5-10% of blog readers use facility search
- **Content Volume:** 100+ published posts
- **Community:** 500+ registered contributors
- **Backlinks:** 50+ referring domains from quality sites

---

## 10. Implementation Phases

### Phase 1: Infrastructure (Week 1-2)
- [ ] Supabase schema setup (posts, categories, authors, comments)
- [ ] Blog UI components (post card, author bio, comment thread)
- [ ] MDX rendering with syntax highlighting
- [ ] SEO meta tags, structured data
- [ ] RSS feed generation

### Phase 2: Core Features (Week 2-3)
- [ ] Post submission form (user stories)
- [ ] Moderation dashboard (staff only)
- [ ] Category/tag filtering
- [ ] Search functionality (Postgres full-text)
- [ ] Related posts algorithm

### Phase 3: Community (Week 3-4)
- [ ] Comment system with moderation
- [ ] Author profiles and badges
- [ ] Upvoting/favoriting posts
- [ ] Email notifications (new replies, featured posts)

### Phase 4: Content Seeding (Ongoing)
- [ ] Hire 2 freelance writers for guides
- [ ] Solicit 10 user stories from communities
- [ ] Write 5 "Best of" facility guides

### Phase 5: Growth (Months 2-6)
- [ ] SEO optimization based on GA4 data
- [ ] Backlink outreach campaign
- [ ] Social media distribution (if channels exist)
- [ ] A/B test conversion CTAs

---

## 11. Competitive Analysis

### Competitors with Content
- **Caring.com:** 10k+ articles, community forum, monetizes via leads
- **AgingCare.com:** Expert advice + Q&A forum, affiliate monetization
- **A Place for Mom:** Blog + local guides, lead generation focus

### SunsetWell Differentiators
✅ **Authentic Stories:** Community-first, not sales-first
✅ **Data-Driven Guides:** 75k facility database powers insights
✅ **Medicare Integration:** Navigate results by specific needs
✅ **Modern UX:** Sunset brand, mobile-optimized, fast
✅ **Free Access:** No lead capture walls on content

---

## 12. Budget Estimate (6 Months)

| Item | Cost | Notes |
|------|------|-------|
| Freelance Writers (20 posts @ $300) | $6,000 | Guides + interviews |
| User Story Incentives (30 @ $150) | $4,500 | Gift cards for submissions |
| Stock Photos (Unsplash Pro) | $0 | Free tier sufficient |
| Moderation (10 hrs/week @ $25/hr) | $6,000 | Part-time community manager |
| SEO Tools (Ahrefs or Semrush) | $600 | Keyword research, backlinks |
| **Total** | **$17,100** | ~$2,850/month |

**ROI Calculation:**
- 10k monthly organic visitors @ 5% conversion = 500 facility searches
- 500 searches @ 10% lead conversion = 50 leads/month
- 50 leads @ $50 value (GTM tracking) = **$2,500/month**
- **Breakeven: Month 7** (assuming $0 revenue initially)
- **Profit: Months 8-12** as traffic compounds

---

## 13. Quick Start Option: MVP Blog

If you want to **launch quickly** without full community features:

### MVP Scope (1 week)
- Static blog using MDX files (no database yet)
- 5-10 seed posts (staff-written or AI-assisted)
- Category pages (Stories, Guides)
- SEO optimization (structured data, meta tags)
- Simple "Share Your Story" email form (manual curation)

### MDX Structure
```
/content/posts/
  finding-memory-care-for-mom.mdx
  va-benefits-guide.mdx
  medicaid-planning-checklist.mdx
```

**Pros:** Fastest path to publishing, zero database work
**Cons:** Manual workflow, no comments/community yet

### Upgrade Path
- Month 2: Add Supabase posts table, migrate MDX content
- Month 3: Add comment system
- Month 4: Add user submissions

---

## Next Steps

**Decision Point:**
1. **Launch MVP blog now** (1 week, MDX-based, 5 posts)
2. **Build full Supabase blog** (3 weeks, community-ready)
3. **Defer until Phase 2A complete** (landing pages + tracking first)

**Recommended:** Start with **MVP blog in parallel** while you handle GTM setup and landing pages. Blog doesn't block monetization work and begins SEO clock immediately.

What's your preference?
