# Elder Care Navigator – Day 1 Codebase Review (GPT-Codex)

## 1. Executive Summary
The repository delivers the expected Week 1 foundation: baseline Next.js scaffold, core domain types, Zod validation, and Supabase schema align with the roadmap. Architecture documentation and collaboration notes are thorough, making it straightforward to continue into the matching and guidance workstreams.【F:docs/architecture.md†L3-L100】【F:docs/COLLABORATION_PLAN.md†L1-L126】

Key alignment gaps remain between the TypeScript contracts, Zod schemas, and database migration. Several fields required in SQL are optional in TypeScript (and vice versa), and API response typings diverge from the documented shapes. Addressing these mismatches plus adding server-side Supabase accessors and basic infra scaffolding will unblock Day 2-3 development.【F:src/types/domain.ts†L114-L145】【F:src/lib/validation/session.ts†L133-L151】【F:supabase/migrations/0001_init.sql†L59-L85】

## 2. Detailed Findings
### Completeness vs. Roadmap
- **Navigator flow utilities** cover step transitions but currently lack skip logic or validation hooks; this matches the roadmap expectation that the full intake UI is still pending.【F:src/lib/navigator/state.ts†L3-L34】
- Documentation promises both browser and server Supabase clients, yet only the browser client exists. Server actions or API routes will need a service-role variant.【F:docs/architecture.md†L17-L23】【F:src/lib/supabase/client.ts†L1-L17】
- API contracts and validation schemas exist, but they are inconsistent with each other (see below), indicating this phase is not fully locked.

### Code Quality & Contract Alignment
- `SessionContext` omits the optional `email` field that is allowed in validation and documented in architecture. This will cause type errors when the intake collects email before matching.【F:src/types/domain.ts†L114-L125】【F:src/lib/validation/session.ts†L63-L96】【F:docs/architecture.md†L30-L47】
- `UserSession.livingSituation` is required in both TypeScript and SQL, yet the intake schema allows it to be omitted. Either enforce selection in the form or allow `null` in SQL and types.【F:src/types/domain.ts†L127-L145】【F:supabase/migrations/0001_init.sql†L59-L85】
- `MatchResponseResource.score` is typed as a `MatchScore` object in `src/types/api.ts`, but the Zod schema expects a bare number with `reasons` as a sibling array, creating a mismatch between runtime validation and compile-time types.【F:src/types/api.ts†L8-L24】【F:src/lib/validation/session.ts†L133-L151】
- `matchResponseSchema.guidance.jobId` enforces a UUID, yet the architecture doc allows arbitrary tokens (e.g., reuse `sessionId`). Relaxing to string avoids unnecessary validation failures during experimentation.【F:src/lib/validation/session.ts†L148-L151】【F:docs/architecture.md†L49-L64】
- Domain enums rely on free-form strings without discriminants for future extensibility. Consider namespacing (e.g., `'urgency.immediate'`) or exporting helper maps for labels to keep UI copy centralized.【F:src/types/domain.ts†L1-L58】

### Integration Readiness
- Lack of a server-side Supabase helper blocks implementing API routes that must use the service role key. Provide `createServerClient` with proper cookie handling for App Router APIs.【F:src/lib/supabase/client.ts†L1-L17】
- No shared error handling utilities exist yet. Introducing a typed `AppError` pattern early will simplify consistent API responses.
- Rate limit schema exists in Zod but no middleware or storage plan is present; we should align on edge middleware before traffic hits.【F:src/lib/validation/session.ts†L161-L165】

### Database & Monetization Considerations
- `user_sessions.living_situation` is `NOT NULL` despite optional intake; likewise `matched_resources` lacks a default empty array, so insertions will fail until values are populated. Add defaults or defer inserts until data is ready.【F:supabase/migrations/0001_init.sql†L59-L85】
- Monetization fields (affiliate URL/network, leads table) exist and match roadmap expectations; click tracking can be layered later without schema changes.【F:supabase/migrations/0001_init.sql†L10-L109】
- Email encryption (`pgcrypto`) extension is enabled but columns are still plain text. Document the plan for `pgp_sym_encrypt` usage or add generated columns when credentials arrive.【F:supabase/migrations/0001_init.sql†L1-L45】

### UX & Accessibility
- Homepage uses high-contrast text and large targets, aligning with tokens, but Tailwind theme is not yet wired to documented design tokens. Translating tokens into `tailwind.config.ts` should happen before wider UI work.【F:src/app/page.tsx†L1-L78】【F:docs/design-tokens.md†L1-L120】
- No loading/error components exist; navigator flow will need skeletons and retry affordances to maintain trust.

### Deployment & Environment
- Supabase client warns when env vars missing but continues to export `undefined`, risking runtime errors. Prefer throwing during build or exposing helper that fails fast in dev.【F:src/lib/supabase/client.ts†L3-L17】
- No env validation (e.g., `env.mjs`) is present. Add Zod-based env parsing before deployment.

## 3. Action Items
### Blockers
1. Align `SessionContext`, Zod schema, and SQL requirements (e.g., email field, living situation nullability) to prevent insert/validation failures.【F:src/types/domain.ts†L114-L145】【F:src/lib/validation/session.ts†L63-L151】【F:supabase/migrations/0001_init.sql†L59-L85】
2. Reconcile `matchResponse` typing so TypeScript and Zod agree on the response structure before implementing the API.【F:src/types/api.ts†L8-L24】【F:src/lib/validation/session.ts†L133-L151】

### High Priority
1. Add server-side Supabase client factory with service role support and cookie handling for API routes.【F:src/lib/supabase/client.ts†L1-L17】
2. Extend Tailwind config to incorporate documented design tokens, ensuring consistent colors/spacing before building navigator UI.【F:docs/design-tokens.md†L1-L180】
3. Draft rate-limiting/error response utilities (middleware or helper functions) using existing schema references.【F:src/lib/validation/session.ts†L161-L165】

### Medium Priority
1. Introduce helper utilities for distance calculations and tag scoring to accelerate the matching engine implementation.【F:docs/architecture.md†L76-L89】
2. Scaffold loading/error states and optional skip logic hooks in navigator state utilities.【F:src/lib/navigator/state.ts†L3-L34】
3. Document (or implement) email encryption usage leveraging `pgcrypto` to satisfy privacy requirements.【F:supabase/migrations/0001_init.sql†L1-L45】

### Deferred
1. Click tracking and advanced analytics; current schema supports later activation.【F:supabase/migrations/0001_init.sql†L10-L125】
2. Affiliate wiring, PDF export, and concierge flows per roadmap Week 3+ scope.【F:docs/COLLABORATION_PLAN.md†L62-L125】

## 4. Open Questions
1. Should `livingSituation` be required in the intake, or can we allow null/"unknown" and update the schema accordingly?【F:src/types/domain.ts†L114-L145】【F:supabase/migrations/0001_init.sql†L59-L85】
2. Will the guidance job ever diverge from `sessionId`, justifying the UUID restriction, or should we allow more flexible identifiers?【F:src/lib/validation/session.ts†L148-L151】【F:docs/architecture.md†L49-L64】
3. What is the intended storage/retention policy for `resources_clicked` and analytics fields—do we need separate logging tables as hinted in architecture notes?【F:supabase/migrations/0001_init.sql†L59-L85】【F:docs/architecture.md†L82-L89】

## 5. Recommended Next Steps (Day 2-3)
- **GPT-Codex:** Patch domain types, schemas, and migration defaults; add server-side Supabase client and shared error utility module. Kick off drafting matching helper functions (scoring heuristics, distance calc) to unblock algorithm work.【F:src/types/domain.ts†L114-L145】【F:src/lib/validation/session.ts†L133-L165】【F:supabase/migrations/0001_init.sql†L59-L85】
- **Claude Code:** Wire Tailwind tokens, scaffold navigator form shell with loading/errors, and prepare CSV importer CLI stub aligned with existing Zod schema.【F:docs/design-tokens.md†L1-L180】【F:src/lib/navigator/state.ts†L3-L34】【F:src/lib/validation/session.ts†L100-L129】

