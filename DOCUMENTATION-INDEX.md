# SunsetWell Documentation Index

Last Updated: October 10, 2025

---

## 📋 Current & Active Documentation

### Primary References
1. **[README.md](README.md)** - Project overview and quick start
2. **[CODEX_NEW_CHAT_INIT.md](CODEX_NEW_CHAT_INIT.md)** - Codex reinitialization (current state)
3. **[NEXT_STEPS.md](NEXT_STEPS.md)** - Immediate next steps

### Feature Implementation
4. **[CODEX_PROMPT_MAP_VIEW.md](CODEX_PROMPT_MAP_VIEW.md)** - Map view implementation spec (for Codex)
5. **[docs/MOBILE-DESIGN-ROADMAP.md](docs/MOBILE-DESIGN-ROADMAP.md)** - Mobile optimization plan ⭐ NEW
6. **[docs/SEO-STRATEGY.md](docs/SEO-STRATEGY.md)** - SEO roadmap and tactics ⭐ NEW

### Technical Documentation
7. **[docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md)** - CMS data processing
8. **[docs/DATA_SEEDING_QUICKSTART.md](docs/DATA_SEEDING_QUICKSTART.md)** - Database seeding
9. **[docs/SERVICE-AREA-MATCHING.md](docs/SERVICE-AREA-MATCHING.md)** - Home health ZIP matching
10. **[GEOCODING-SETUP.md](GEOCODING-SETUP.md)** - Google Geocoding API setup

### Design & Brand
11. **[docs/PHOTO-STYLE-GUIDE.md](docs/PHOTO-STYLE-GUIDE.md)** - Visual brand guidelines
12. **[docs/design-tokens.md](docs/design-tokens.md)** - Design system (may be outdated)

### Business & Strategy
13. **[docs/PROFESSIONAL-FEATURES.md](docs/PROFESSIONAL-FEATURES.md)** - B2B roadmap (social workers)
14. **[docs/MONETIZATION_STRATEGY.md](docs/MONETIZATION_STRATEGY.md)** - Revenue models
15. **[docs/LEAD-GENERATION.md](docs/LEAD-GENERATION.md)** - Lead capture strategy
16. **[docs/COMPETITIVE_STRATEGY.md](docs/COMPETITIVE_STRATEGY.md)** - Competitor analysis

### Advanced Features (Future)
17. **[docs/AI-FEATURES-ROADMAP.md](docs/AI-FEATURES-ROADMAP.md)** - AI enhancements
18. **[docs/ADDITIONAL_SERVICES.md](docs/ADDITIONAL_SERVICES.md)** - Additional offerings

### Setup & Infrastructure
19. **[docs/SUPABASE_SETUP_INSTRUCTIONS.md](docs/SUPABASE_SETUP_INSTRUCTIONS.md)** - Database setup
20. **[docs/infra-setup.md](docs/infra-setup.md)** - Infrastructure

---

## 🗑️ Archive (Outdated - Can Delete)

### Completed Tasks (Historical)
- **DAY_2_SUMMARY.md** - Superseded by current state
- **PROGRESS_SUMMARY.md** - Old progress report
- **PROGRESS_UPDATE.md** - Duplicate progress tracking
- **IMPLEMENTATION-SUMMARY.md** - Completed implementation notes
- **PRODUCTION-READY-SUMMARY.md** - Deployment checklist (completed)
- **GEOCODING-IMPLEMENTATION-COMPLETE.md** - Geocoding completed
- **SEEDING_SUMMARY.md** - Seeding completed

### One-Time Migration Tasks
- **CLAUDE_CHROME_MIGRATION_TASK.md** - Completed migration
- **MIGRATION-INSTRUCTIONS.md** - Completed migrations
- **RUN-THIS-SQL.md** - SQL already executed
- **RUN-SERVICE-AREAS-SQL.md** - SQL already executed
- **CLAUDE-CHROME-SERVICE-AREAS.md** - Task completed
- **CLAUDE_CODE_UPDATE.md** - Updates applied

### Old Deployment Docs
- **VERCEL_DEPLOYMENT.md** - May be outdated (check if using Vercel)

### Potentially Outdated
- **IMPROVEMENTS-ROADMAP.md** - Check if superseded by new roadmaps
- **docs/architecture.md** - May need updating
- **docs/DEVELOPMENT_WORKFLOW.md** - May be outdated
- **docs/TECHNICAL_DECISIONS.md** - May be outdated
- **docs/COLLABORATION_PLAN.md** - May be outdated

---

## 📊 Documentation Organization

### Recommended Structure

```
/
├── README.md                           # Start here
├── DOCUMENTATION-INDEX.md              # This file
├── NEXT_STEPS.md                       # What to do next
├── CODEX_NEW_CHAT_INIT.md             # For Codex
├── CODEX_PROMPT_MAP_VIEW.md           # For Codex
├── GEOCODING-SETUP.md                 # Setup guide
│
├── docs/
│   ├── CURRENT/                        # Active documentation
│   │   ├── MOBILE-DESIGN-ROADMAP.md
│   │   ├── SEO-STRATEGY.md
│   │   ├── PHOTO-STYLE-GUIDE.md
│   │   ├── PROFESSIONAL-FEATURES.md
│   │   ├── DATA_PIPELINE.md
│   │   ├── SERVICE-AREA-MATCHING.md
│   │   ├── MONETIZATION_STRATEGY.md
│   │   ├── LEAD-GENERATION.md
│   │   ├── COMPETITIVE_STRATEGY.md
│   │   ├── AI-FEATURES-ROADMAP.md
│   │   └── SUPABASE_SETUP_INSTRUCTIONS.md
│   │
│   └── ARCHIVE/                        # Historical docs
│       ├── completed-migrations/
│       ├── old-summaries/
│       └── deprecated/
```

---

## 🚀 Quick Start Guide

**New Developer Onboarding:**
1. Read [README.md](README.md)
2. Follow [docs/SUPABASE_SETUP_INSTRUCTIONS.md](docs/SUPABASE_SETUP_INSTRUCTIONS.md)
3. Run data pipeline: [docs/DATA_SEEDING_QUICKSTART.md](docs/DATA_SEEDING_QUICKSTART.md)
4. Setup geocoding: [GEOCODING-SETUP.md](GEOCODING-SETUP.md)

**For Codex (AI Assistant):**
1. Read [CODEX_NEW_CHAT_INIT.md](CODEX_NEW_CHAT_INIT.md)
2. Implement map view: [CODEX_PROMPT_MAP_VIEW.md](CODEX_PROMPT_MAP_VIEW.md)

**Current Sprint:**
1. Mobile optimization: [docs/MOBILE-DESIGN-ROADMAP.md](docs/MOBILE-DESIGN-ROADMAP.md)
2. SEO improvements: [docs/SEO-STRATEGY.md](docs/SEO-STRATEGY.md)

---

## 📝 Maintenance

### When to Update This Index
- After major feature completion
- When adding new documentation files
- When deprecating old docs
- At the start of each sprint/phase

### How to Archive Documents
```bash
# Create archive directory
mkdir -p docs/ARCHIVE/{completed-migrations,old-summaries,deprecated}

# Move outdated files
mv DAY_2_SUMMARY.md docs/ARCHIVE/old-summaries/
mv MIGRATION-INSTRUCTIONS.md docs/ARCHIVE/completed-migrations/
```

---

Built with care for SunsetWell.com 🌅
