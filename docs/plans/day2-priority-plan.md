# Day 2 Implementation Priorities

## Immediate Blockers
1. **Align intake contracts** – Update `SessionContext` types, Zod schemas, and the Supabase migration so optional fields (email, living situation) share the same nullability rules. This prevents inserts and API validation from drifting.
2. **Unify match response shapes** – Ensure `matchResponseSchema` and TypeScript interfaces agree on score + reasons structure so `/api/match` can return data without runtime type casting.

## High Priority Work
1. **Server-side Supabase client** – Add a helper that instantiates the service-role client with cookie forwarding for App Router routes and server actions.
2. **Environment validation** – Introduce a Zod-based config module that fails fast when required env vars are missing.
3. **Tailwind token wiring** – Translate `docs/design-tokens.md` colors, typography, and spacing into the Tailwind config to unlock UI work.

## Supporting Tasks
- Draft shared error/response helpers for API routes (standardize `AppError`, `Result` pattern, HTTP status mapping).
- Begin distance and tag scoring utilities that the matching engine will consume.
- Sketch navigator loading/error components so the UI shell is ready for data integration.

## Coordination Notes
- Pair the contract alignment with SQL defaults (e.g., empty `matched_resources` array) to avoid future migration churn.
- Defer monetization hooks beyond ensuring schema columns exist; focus on intake → match → guidance flow this week.
- Schedule a quick design/dev sync after Tailwind tokens land to confirm accessibility targets.
