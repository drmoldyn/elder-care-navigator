# Elder Care Navigator

Collaborative build between GPT-Codex and Claude Code Sonnet 4.5 for the Elder Care Navigator MVP. The goal is to deliver an intelligent navigator that curates trusted resources and AI guidance for long-distance dementia caregivers.

## Day 1 Deliverables

- Next.js 15 App Router project bootstrapped with TypeScript, Tailwind CSS v4, ESLint, and pnpm.
- shadcn/ui initialized with base theme + Button, Input, Card, and Badge components.
- Layout skeleton with header/footer and a roadmap-aligned homepage hero.
- Supabase migration scaffold (`supabase/migrations/0001_init.sql`) and sample resource CSV (`supabase/seed/resources.sample.csv`).
- Supabase client wrapper at `src/lib/supabase/client.ts`.
- Environment template `.env.example` with required keys.

## Prerequisites

- Node.js 18+
- pnpm (`corepack enable pnpm` if not installed)

## Installation

```bash
pnpm install
```

## Local Development

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the scaffold.

## Project Structure Highlights

- `src/app` – Next.js App Router pages.
- `src/components` – shadcn/ui components plus layout primitives.
- `src/lib` – shared libraries (Supabase client, utilities).
- `supabase/migrations` – SQL migrations for Supabase.
- `supabase/seed` – CSV seed data for resource importer.
- `docs/` – collaboration artifacts (roadmap, coordination notes).

## Next Steps

Follow `docs/COLLABORATION_PLAN.md` for the day-by-day breakdown. Upcoming priorities include:

1. Define shared TypeScript domain models and Zod validation schemas.
2. Implement CSV import contract and monitoring schema.
3. Scaffold Supabase edge utilities and analytics wiring.

## Deployment

A Vercel project should be provisioned once environment variables are available. For now, run locally with the placeholder configuration above.

## Need Help Applying Plan Updates?

If you are unsure how to copy the planning documents or reviews into your production workflow, follow [docs/guides/how-to-apply-updates.md](docs/guides/how-to-apply-updates.md) for a quick walkthrough of editing files directly in GitHub or opening a pull request.
