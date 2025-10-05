# Elder Care Navigator – Technical Architecture

## High-Level Flow
1. **Navigator Intake (App Router page)** collects caregiver context across six steps.
2. Client assembles a canonical `SessionContext` object and submits it to `POST /api/match`.
3. The match route:
   - Validates payload (Zod)
   - Persists a `user_sessions` record
   - Runs the rule-based matcher to produce scored resource IDs
   - Responds with the session ID, ranked results, and a guidance job token (status `pending`).
4. The frontend renders resources immediately and polls `GET /api/guidance/{sessionId}` until AI guidance is `complete` (or `failed` with fallback copy).
5. Guidance is generated asynchronously via Claude Sonnet and stored back on the session row. Results and optional email capture reuse that session ID.

## Project Structure Snapshot
- `src/app` – App Router routes (`navigator`, `results/[sessionId]`, APIs).
- `src/components` – Shared UI (shadcn/ui primitives + layout + navigator widgets).
- `src/lib`
  - `navigator/state.ts` – step sequencing utilities
  - `matching/` – upcoming matching logic
  - `supabase/` – client wrappers (browser & server)
  - `ai/` – Claude prompt + executor (pending)
  - `validation/` – Zod schemas (`session`, `csv`, etc.)
- `src/types`
  - `domain.ts` – shared domain types/enums
  - `api.ts` – request/response contracts
- `supabase/migrations` – SQL schema (resources, user_sessions, leads, feedback)
- `supabase/seed` – CSV samples for importer tooling
- `docs/` – roadmap, collaboration log, architecture (this file)

## Domain Contracts
### SessionContext (client → server)
```
{
  relationship?: 'adult_child' | 'spouse' | 'other_family' | 'friend';
  conditions: ResourceCondition[]; // at least 1
  zipCode?: string; // 5 or 9 digit
  city?: string;
  state?: string; // 2-letter uppercase
  livingSituation?: LivingSituation;
  urgencyLevel?: UrgencyLevel;
  urgencyFactors: Array<'safety_concern' | 'medical_change' | 'caregiver_burnout' | 'planning' | 'financial'>; // at least 1
  careGoals?: string[];
  budget?: CostType;
  email?: string;
}
```
Validated with `sessionContextSchema` (`src/lib/validation/session.ts`).

### Match Response (`POST /api/match`)
```
{
  sessionId: string;            // UUID from Supabase
  resources: [
    {
      resourceId: string;       // UUID
      score: { resourceId; score: number; reasons: string[] };
      rank: 'top' | 'recommended' | 'nice_to_have';
    }
  ];
  guidance: {
    status: 'pending' | 'complete' | 'failed';
    jobId: string;              // guidance job token = sessionId for now
  };
}
```
### Guidance Poll (`GET /api/guidance/:sessionId`)
```
{
  sessionId: string;
  status: 'pending' | 'complete' | 'failed';
  guidance?: string;            // present when status === 'complete'
  fallback?: boolean;           // true when cached copy used
}
```

## Backend Responsibilities
- **Matching Engine** (Week 2): deterministic scoring over curated resources using tags (conditions, urgency, location match, audience). Outputs `score` + explanation.
- **Guidance Worker** (Week 3): wraps Claude Sonnet call with retry + cost guardrails. Stores AI output on `user_sessions.ai_guidance`.
- **Supabase**: PostgreSQL tables defined in `0001_init.sql`; RLS and pgcrypto email encryption follow during Claude’s DB sprint.
- **Rate Limiting**: Edge middleware (token bucket per IP) + Supabase logging for suspicious bursts.

## Data & Observability
- Session + match telemetry stored in Supabase (`user_sessions`) with optional hashed IP for abuse detection.
- Resource catalogue managed via CSV importer (Zod schema + CLI/Edge function TBD).
- Logging schema (Day 3)
  - `match_request` (ip, sessionId, duration, resourceCount)
  - `guidance_request` (sessionId, latency, outcome)
  - `resource_click` (sessionId, resourceId)
- Monitoring: Vercel Analytics + Supabase logs initially; Sentry once API surface stabilises.

## Deferred Monetization Hooks
- Affiliate metadata already present on resource model; activation requires UTM helper + click tracking (Week 3+).
- Lead capture components will reuse the same `user_sessions` record and write to `leads` table once business rules are finalised.

## Outstanding Decisions
- Finalise CSV importer interface (headers + validation error format).
- Choose caching strategy for hot match queries (in-memory vs. Edge Config) after initial traffic.
- Define privacy notice + retention window (planned: auto purge/anonymise sessions after 60 days).

This document will evolve as we lock Week 2 matching details and Claude’s subagents deliver database tooling.
