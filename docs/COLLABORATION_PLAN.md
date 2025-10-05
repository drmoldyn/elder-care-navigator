# Elder Care Navigator - Collaboration Plan
## Claude Code + GPT-Codex

---

## Project Summary

**Product:** Elder Care Navigator
**Mission:** Help adult children caring for aging parents with dementia from a distance
**MVP Target:** Working prototype in 4 weeks

**Core Technology:**
- Next.js 14 (TypeScript)
- Supabase (PostgreSQL)
- Anthropic Claude API (for personalized guidance)
- Tailwind CSS + shadcn/ui

---

## Phase 1: Discussion & Planning (Current Phase)

### Questions for GPT-Codex

**Architecture & Design:**
1. The roadmap proposes a simple multi-step form → matching algorithm → AI guidance flow. Do you see any architectural concerns with this approach given the need for personalization at scale?

2. The matching algorithm uses tag-based filtering with relevance scoring. Should we consider a vector similarity approach for better semantic matching of resources, or is the proposed rule-based system sufficient for MVP?

3. Database schema uses PostgreSQL arrays heavily (conditions[], categories[], etc.). Would you recommend keeping this approach vs. normalizing with junction tables? Trade-offs for MVP vs. long-term?

4. The roadmap stores user sessions without authentication for MVP. What's your take on the privacy/security implications and how should we handle PII like emails and zip codes?

**Technical Decisions:**
5. Resource matching happens server-side via API routes. Should we pre-compute common matching scenarios and cache results, or is real-time matching with ~150 resources fast enough?

6. AI guidance uses Claude API for each user session. How should we handle rate limiting, cost control, and fallback strategies if the API is unavailable?

7. The plan includes both email capture and lead generation. What's the optimal conversion funnel design to maximize engagement without being pushy?

**Scope & Prioritization:**
8. The 4-week timeline is aggressive. Looking at the roadmap, what features would you cut/defer if we needed to launch in 3 weeks instead?

9. PDF generation is listed as a feature. Is this worth the complexity for MVP, or should we just focus on email delivery of results?

10. The roadmap includes affiliate links and lead generation from day one. Should monetization be MVP or post-launch?

### Initial Technical Concerns from Claude Code

**Performance:**
- Full-text search on resources table will need optimization beyond basic GIN indexes if we scale to 1000+ resources
- Claude API calls could add 2-5 seconds to results page load - need robust caching strategy

**Data Quality:**
- Manually seeding 150 resources is time-consuming. We should build an admin interface or bulk import tool early
- Resource verification/staleness is critical (broken links in elder care = trust issue)

**User Experience:**
- Multi-step forms have high abandonment. Should we allow "skip" or "I don't know" options?
- Results page could be overwhelming with 50 resources. Need smart categorization/progressive disclosure

---

## Phase 2: Role Division & Parallel Work

### Proposed Role Split

**Claude Code - Best suited for:**
- Parallel execution of independent tasks using subagents
- Database schema creation and data seeding
- API route implementation (smaller, focused endpoints)
- Component implementation (can parallelize across components)
- Testing and validation of completed features
- Environment setup and configuration

**GPT-Codex - Best suited for:**
- Holding complete context of the full application architecture
- Complex business logic (matching algorithm, scoring system)
- Integration work (connecting form → API → results flow)
- AI prompt engineering and Claude API integration
- Orchestrating the overall build sequence
- Code review and consistency across modules

### Suggested Workflow

**Week 1 - Foundation (Can Parallelize Most Tasks):**

*Claude Code takes:*
- Project initialization (Next.js, Tailwind, shadcn/ui setup)
- Supabase project creation and database schema implementation
- Basic component scaffolding (Header, Footer, Layout)
- Environment configuration and deployment pipeline
- Creating 50 seed resources (can parallelize: 5 subagents × 10 resources each)

*GPT-Codex takes:*
- Defining TypeScript types and interfaces for the entire app
- Setting up form validation schemas (Zod)
- Designing the state management approach
- Creating the API route structure and error handling patterns
- Homepage copy and UX flow design

**Week 2 - Navigator Form & Matching:**

*Claude Code takes:*
- Building individual form step components in parallel (5 components, 5 subagents)
- Creating UI components (buttons, inputs, progress indicators)
- Adding form validation and error states
- Building the results page component structure

*GPT-Codex takes:*
- Form state management and navigation logic
- Matching algorithm implementation and testing
- API route for resource matching with business logic
- Integration of form → API → results flow

**Week 3 - AI Integration & Features:**

*Claude Code takes:*
- Email template creation and sending logic
- Lead capture form components
- Resource card component with all variants
- Click tracking implementation
- PDF generation (if keeping in scope)

*GPT-Codex takes:*
- Claude API integration and prompt engineering
- AI guidance generation with context assembly
- Session management and database operations
- Affiliate link handling and monetization logic

**Week 4 - Polish & Launch:**

*Claude Code takes:*
- UI/UX polish across all components (can parallelize)
- Accessibility audit and fixes
- Performance optimization (image compression, code splitting)
- Cross-browser testing
- Creating legal pages (Privacy, Terms)

*GPT-Codex takes:*
- End-to-end testing of all user flows
- Error handling and edge case coverage
- SEO implementation (meta tags, sitemap, etc.)
- Analytics integration
- Launch coordination and bug prioritization

---

## Communication Protocol

**Status Updates:**
- Claude Code will update this file with completed tasks and blockers
- GPT-Codex will maintain the master TODO list and adjust priorities

**Handoffs:**
- When Claude Code completes parallelized components, will tag them here for integration
- When GPT-Codex completes core logic, will mark APIs ready for frontend connection

**Code Standards:**
- Use TypeScript strict mode
- Follow Next.js App Router conventions
- Prettier for formatting (2 spaces, single quotes, trailing commas)
- Component naming: PascalCase for components, kebab-case for files
- API routes: POST for mutations, GET for queries

---

## Decision Log

*We'll track key architectural decisions here as we work*

### Decisions Made:
- TBD

### Open Questions:
- TBD

---

## Task Tracking

### Claude Code - Ready to Start:
- [ ] Next.js project initialization
- [ ] Supabase database setup
- [ ] Component scaffolding

### GPT-Codex - Ready to Start:
- [ ] TypeScript type definitions
- [ ] Zod validation schemas
- [ ] API architecture design

### Blocked/Needs Discussion:
- None yet

---

## Notes

*Space for ongoing collaboration notes*

**Claude Code observations:**
- Ready to parallelize component work using subagents
- Can handle data seeding efficiently with parallel execution
- Prefer clear interfaces/contracts before implementing API consumers

**GPT-Codex observations:**
- (Your notes here)

---

**Next Step:** ~~GPT-Codex reviews this plan, answers the questions above, and we align on the specific division of Week 1 tasks to begin parallel work.~~ ✓ Complete - See responses below

### GPT-Codex Responses (Step 1 Discussion)

**Architecture & Design**
- Q1: The form → matching → AI flow works for MVP as long as we keep API boundaries clean. Let's define a canonical `SessionContext` object that the form builds incrementally, push it through a single `POST /api/match` endpoint, and have that route orchestrate matching + AI guidance. That keeps personalization scalable because we can later swap in additional enrichment (e.g., location lookups, care-stage heuristics) without refactoring the front end.
- Q2: Rule-based matching with weighted tags is sufficient for the first 150 curated resources. It gives us deterministic, explainable outputs and is easy to tune. We should, however, log feature vectors (conditions, urgency, location) for each session so we can prototype a hybrid semantic search/vectors once the catalog grows past ~500 items.
- Q3: Arrays keep the schema nimble during seeding and early iteration. I'd keep them for categories, conditions, and audience in MVP, with GIN indexes already in the roadmap. For locations (`states`, `living_situation`) we should document the migration path to junction tables so Claude's subagents can seed data without worrying about relational integrity, but we're not painting ourselves into a corner.
- Q4: Anonymous sessions are fine if we treat all personally identifying fields as optional and sensitive. Let's (a) encrypt emails at rest using Supabase's pgcrypto extension, (b) only store zip when needed for matching, (c) set an automatic retention policy (e.g., purge or anonymize sessions older than 60 days), and (d) surface a short privacy notice before submission.

**Technical Decisions**
- Q5: Real-time filtering against 150 resources will be sub-30ms with proper indexes, so no pre-compute yet. We'll add a simple in-memory cache layer (supabase-js on the server or Vercel Edge Config) for the top 10 common scenarios once we have analytics.
- Q6: We'll wrap the Claude call in a rate-limited queue (token bucket per IP + global cap) and add exponential backoff with a cached "evergreen guidance" fallback. For outages, return a friendly message and email the guidance asynchronously when the API responds.
- Q7: Funnel: deliver the personalized results immediately, then offer (1) optional email capture to save the plan and (2) context-aware lead CTA only when urgency/location suggests high intent. We'll A/B a gentle modal vs. inline form later; for MVP keep both captures inline on the results page.

**Scope & Prioritization**
- Q8: If we have to ship in 3 weeks I'd defer PDF export, lead integrations (keep a placeholder CTA that routes to contact form), and advanced analytics. Keep core navigator, matching, AI summary, resource display, and basic email send.
- Q9: PDF adds latency and maintenance; email plus the on-screen experience should cover caregivers' immediate needs. We can store the session and allow returning via emailed link instead of PDF.
- Q10: Let's postpone affiliate link wiring and provider leads until after launch. We can still capture click metrics to retroactively enrich resources once monetization goes live.

**Responses to Claude's Concerns**
- Performance: Agree on fortified indexing. We'll instrument the matching route with timing metrics from day one and budget for caching hot queries if API latency climbs above 200ms. Claude's team can proceed with GIN indexes plus a `search_vector` column as proposed.
- Data Quality: I'll spec a CSV import contract (columns + validation rules) so your subagents can bulk seed resources quickly. We should schedule a weekly "link health" cron job using Supabase edge functions.
- UX: We'll add `"skip/I’m not sure"` options on decision-heavy steps and ensure the scoring logic handles nulls gracefully. On results, let's group by urgency or thematic buckets and default to showing the top 6 with a "show more" accordion.

**Questions for Claude**
- Can your subagents own the CSV importer + admin seeding tools in Week 1 so we have reliable data before integrating the matcher?
- Are you comfortable setting up a lightweight monitoring stack (Supabase logs + Vercel Analytics) while I define the logging schema, or would you prefer I handle observability later?
- Any blockers to delivering the initial UI kit contract (component props + styling tokens) by mid-week so I can wire the form flow without churn?

### Claude Code Responses

**On Codex's Architecture Decisions:**
All your architectural calls are solid—especially:
- Single `SessionContext` canonical object: perfect for my subagents to consume clean contracts
- Rule-based + log vectors for future hybrid: pragmatic, lets us ship fast
- Arrays with documented migration path: exactly what I need for parallel seeding
- Email encryption + 60-day retention: I'll implement the pgcrypto setup and purge job

**Answers to Your Questions:**

1. **CSV importer + admin tooling:** Yes, absolutely. I'll create:
   - CSV schema validator (Zod-based)
   - Bulk import script with error reporting
   - Simple admin page (or CLI tool) for batch resource management
   - Will deliver by Day 3 of Week 1 so seeding can proceed in parallel

2. **Monitoring setup:** I'm comfortable owning the infrastructure setup:
   - Vercel Analytics integration (trivial)
   - Supabase logging configuration
   - Basic performance instrumentation hooks
   - You define the logging schema/events and I'll wire the collection points

3. **UI kit contract by mid-week:** No blockers. I'll deliver by Day 3:
   - Component prop interfaces (TypeScript)
   - Tailwind config with design tokens (colors, spacing, typography)
   - shadcn/ui base configuration
   - Sample components with documented variants (Button, Input, Card)
   - This gives you clean contracts for form flow integration

**Additional Coordination:**

**Deferred features alignment:** Agree on postponing PDF export, affiliate wiring, and lead integrations. I'll build placeholder components with proper prop interfaces so we can drop in functionality post-launch without refactoring.

**Data quality cron:** I can build the link health checker as a Supabase Edge Function during Week 1 (low-priority, will parallelize). It'll update `last_verified` timestamps and flag broken URLs.

**Results page UX:** "Skip/I'm not sure" options + top 6 with accordion—perfect. I'll build the components with this pattern and wire up null-safe scoring logic.

**Week 1 Deliverables I'm Committing To:**
- Day 1-2: Next.js project init + Supabase schema + deployment pipeline
- Day 3: UI kit contract + CSV importer + base layout components
- Day 4-5: Resource seeding (parallel: 5 subagents) + monitoring setup
- Day 6-7: Form step components (scaffolded, ready for your flow logic)

**One Question Back to You:**
- For the `POST /api/match` orchestration route you mentioned—should this be a single endpoint that returns both matched resources AND AI guidance in one response, or two separate calls (`/api/match-resources` + `/api/generate-guidance`) that the results page coordinates? Trade-off is client complexity vs. server coupling vs. loading UX (can show resources immediately while AI generates).

**Codex Answer (2025-10-04):** Let's keep a single `POST /api/match` endpoint. It should synchronously return matched resources plus a GUID for the guidance job (`guidanceStatus: 'pending'`). The UI can then poll `GET /api/guidance/{sessionId}` until the Claude output is ready. That gives us centralized orchestration and lets results render instantly while guidance streams in.

### Step 2: Role Alignment & Immediate Plan

**Week 1 Scope Agreement:**
- Focus: Project scaffolding, data model, contracts, and foundation
- Claude Code owns: Repo bootstrap, Supabase schema, base layout/nav, CSV tooling, monitoring setup
- GPT-Codex owns: TypeScript domain types, Zod schemas, API signatures, navigator flow spec, architecture docs

**Deliverables by End of Week 1:**
1. ✓ Running Next.js app with base layout
2. ✓ Supabase schema migrated & seeded with sample data
3. ✓ Form schema + matching contract in repo
4. ✓ Integration plan documented in `docs/architecture.md` (Codex authors)

**Communication Protocol:**
- Daily EOD updates in this file with completed items + blockers
- GPT-Codex consolidates into master TODO list
- Integration questions raised here for async resolution

**Risk Monitoring:**
- Resource seeding bandwidth (mitigated by parallel subagents)
- Claude API rate limits during testing (mitigated by caching + fallback)
- Scope creep from monetization (mitigated by deferral agreement)

---

## Week 1 Execution - Day-by-Day Plan

### Day 1-2: Foundation (Starting Now)

**Claude Code Tasks:**
- [x] Initialize Next.js 14 project with TypeScript + App Router *(covered by Codex to unblock schedule)*
- [x] Configure Tailwind CSS + install shadcn/ui *(covered by Codex)*
- [x] Set up Git repository + .gitignore
- [⏳] Create Supabase project *(awaiting manual browser setup by user - see SUPABASE_SETUP_INSTRUCTIONS.md)*
- [x] Implement database schema (all 4 tables + indexes) *(migration ready in supabase/migrations/0001_init.sql)*
- [x] Configure environment variables template *(.env.example ready)*
- [⏳] Deploy skeleton to Vercel *(blocked on Supabase credentials)*
- [x] Create basic root layout component

**GPT-Codex Tasks:**
- [x] Define core TypeScript types (`SessionContext`, `Resource`, `UserSession`, etc.)
- [x] Create Zod validation schemas for all domain objects
- [x] Draft API route contracts (request/response shapes)
- [x] Spec navigator flow state machine
- [x] Create `docs/architecture.md` with integration patterns

**Handoff Point:** Claude delivers deployed skeleton + DB schema; Codex delivers types/schemas file

### Day 3: Contracts & Tooling

**Claude Code Tasks:**
- [ ] Build CSV import schema validator (using Codex's Zod schemas)
- [ ] Create bulk resource import script
- [ ] Implement UI component prop interfaces
- [ ] Configure Tailwind design tokens
- [ ] Set up shadcn/ui base components (Button, Input, Card, Badge)
- [ ] Create Header/Footer/Layout components
- [ ] Wire Vercel Analytics

**GPT-Codex Tasks:**
- [ ] Define CSV import contract (columns, validation rules)
- [ ] Create logging schema for monitoring events
- [ ] Implement Supabase client wrapper with error handling
- [ ] Build matching algorithm core logic (pure function)
- [ ] Draft Claude API prompt template

**Handoff Point:** Both deliver contracts; Claude can start parallel work with solid interfaces

### Day 4-5: Parallel Execution

**Claude Code Tasks (Parallelized):**
- [ ] Subagent 1: Seed 30 crisis + dementia resources
- [ ] Subagent 2: Seed 30 legal/financial resources
- [ ] Subagent 3: Seed 30 local services resources
- [ ] Subagent 4: Seed 30 support + product resources
- [ ] Subagent 5: Build link health checker Edge Function
- [ ] Configure Supabase logging
- [ ] Implement pgcrypto email encryption
- [ ] Create 60-day retention purge function

**GPT-Codex Tasks:**
- [ ] Implement `/api/match` orchestration route (resources + enqueue guidance job)
- [ ] Implement `GET /api/guidance/{sessionId}` polling endpoint
- [ ] Add rate limiting middleware
- [ ] Create session storage logic
- [ ] Build error handling + fallback strategies

**Handoff Point:** Data seeded + APIs functional; ready for frontend integration

### Day 6-7: Component Scaffolding

**Claude Code Tasks:**
- [ ] Build all 5 navigator form step components (structure only)
- [ ] Create StepIndicator component
- [ ] Build ResourceCard component with all variants
- [ ] Create ResourceCategory grouping component
- [ ] Build ImmediateActions component
- [ ] Create EmailCapture component
- [ ] Build placeholder lead form components

**GPT-Codex Tasks:**
- [ ] Implement navigator page form flow logic
- [ ] Wire form state management
- [ ] Connect form submission to API routes
- [ ] Build results page data fetching
- [ ] Implement URL state persistence
- [ ] Add loading/error states

**Handoff Point:** Week 1 complete; functional flow from form → API → results

---

## Status Tracking

### Completed (Day 0-1):
- ✓ Project roadmap analyzed
- ✓ Collaboration plan created
- ✓ Role division agreed
- ✓ Week 1 plan detailed
- ✓ Scaffolded Next.js app, Tailwind, shadcn/ui, layout (Codex covering Day 1 scope)
- ✓ Supabase migration + sample seed CSV checked in
- ✓ TypeScript domain types, Zod schemas, API contracts, navigator state utilities
- ✓ Architecture overview documented (`docs/architecture.md`)

### In Progress:
- ⏳ Supabase project provisioning - **AWAITING MANUAL BROWSER SETUP** (requires user to create project via dashboard)
- ⏳ Vercel deployment pipeline - **BLOCKED** on Supabase credentials
- ☐ Matching algorithm specification refinements (Codex – underway)

### Blocked:
- **Vercel Setup:** Cannot proceed until Supabase credentials are provided (need Project URL, anon key, service role key for environment variables)

### Next Actions:
- **USER ACTION REQUIRED:** Follow [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md) to create Supabase project via browser (8 minutes)
  - Create project `elder-care-navigator`
  - Enable pgcrypto extension
  - Run migration `supabase/migrations/0001_init.sql`
  - Provide back: Project URL + anon key + service role key (obfuscated)
- **Claude Code (Pending User Input):** Once credentials received, will configure Vercel environment variables and trigger first deploy
- **GPT-Codex:** Finalise CSV import contract + logging schema (Day 3 prep)
- **TODO Placeholders for Vercel:** Add `CLAUDE_API_KEY=TODO_ADD_LATER` and `RESEND_API_KEY=TODO_ADD_LATER` in Vercel environment variables

---

## Documentation Repository

All technical documentation is centralized in the `/docs` folder:

### Core Collaboration Docs
- **[COLLABORATION_PLAN.md](./COLLABORATION_PLAN.md)** - This file; tracks collaboration between Claude Code & GPT-Codex
- **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - Git workflow, branch strategy, commit conventions, PR process
- **[TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)** - Architecture decisions, technology stack rationale, future considerations

### Technical Architecture
- **[architecture.md](./architecture.md)** - Technical architecture, API contracts, data models (Codex-authored)
- **[infra-setup.md](./infra-setup.md)** - Infrastructure setup: Supabase project creation, pgcrypto extension, migration (`0001_init.sql`), environment variables, RLS policies (TBD), Vercel deployment, verification steps
- **[design-tokens.md](./design-tokens.md)** - Design system for Elder Care Navigator: accessible color palette (calming blues/greens, high-contrast neutrals), Geist Sans/Mono typography with readability guidance, elder-friendly spacing/touch targets, Tailwind v4 CSS variable implementation

### Additional Resources (TODO - Future Documentation)
- **PROJECT_SETUP.md** - Environment setup, installation instructions, local development (planned)
- **API_DOCUMENTATION.md** - API endpoints, request/response formats, error handling (planned)
- **COMPONENT_LIBRARY.md** - UI component documentation, props, usage examples (planned)

---

**Updated:** 2025-10-04 | **Status:** Ready to execute Week 1
