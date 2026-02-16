# Entrestate OS

Decision infrastructure for real estate operators. This repo powers the Entrestate platform: market intelligence, rule-based scoring, match tooling, and the Media Creator studio.

## What’s inside
- **Markets & matching**: Rule-based inventory scoring, match rules, and investor alignment (Neon).
- **Market Intelligence Desk**: Market data exploration and briefs (Neon).
- **Market Score**: KPI validation and truth checks (Neon).
- **Investor Match Desk**: Operator-grade matching desk (Neon).
- **Media Creator**: Storyboards, visuals, and video timelines backed by project media.
- **Agent-First Builder**: Business-first agent creation (execution in preview mode for select nodes).

## Tech stack
- Next.js (App Router)
- Tailwind CSS v4
- TypeScript
- Prisma (raw SQL via `prisma.$queryRaw`)
- Neon Postgres

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
NEON_AUTH_BASE_URL=https://your-neon-auth-url.neon.tech
NEON_AUTH_COOKIE_SECRET=your-secret-at-least-32-characters-long
NEON_AUTH_ADMIN_EMAILS=admin@entrestate.com,ops@entrestate.com
NEXT_PUBLIC_ADMIN_MODE=false
NEXT_PUBLIC_ENABLE_AGENT_BUILDER=false
UPSTASH_REDIS_REST_URL=https://your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are required for Neon-backed features.
- `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` enable Neon Auth session handling.
- `NEON_AUTH_ADMIN_EMAILS` is optional for server-side admin gating.
- `NEXT_PUBLIC_ADMIN_MODE=true` enables override controls on Market Score and Agent Runtime (non-production only).
- `NEXT_PUBLIC_ENABLE_AGENT_BUILDER=true` enables Agent Builder routes in production.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable shared rate limiting (optional but recommended).

## Key routes

### Platform
- `/markets` — live inventory search
- `/top-data` — curated signals + live chat
- `/library` — research library
- `/workspace` — data + decision tools
- `/market-score` — scoring validation
- `/agent-runtime` — investor match desk

### Media Creator
- `/agents` — studio landing
- `/storyboard` — storyboard builder
- `/image-playground` — visual builder
- `/timeline` — video timeline

### Apps
- `/apps` — app catalog
- `/apps/agent-builder` — Agent‑First Builder
- `/apps/lead-agent` — Insta DM lead agent kit
- `/apps/coldcalling` — cold calling workflows

## Data map
- `docs/neon-data-map.md` — data tables, functions, and usage map
- `site-map.md` — full route catalog + implementation status

## Notes
- Price fields are **DOUBLE PRECISION** end‑to‑end.
- Override flows are logged to `investor_override_audit`.
- Agent Builder audio/embedding/structured output nodes run in **preview** mode.

## CI
- DB contract tests run via `.github/workflows/db-contract.yml`.
- Set `NEON_DATABASE_URL` as a GitHub Actions secret for the nightly run.
- See `FINALIZATION.md` for the release checklist and `docs/smoke-finalization-guide.md` for the hardened preview smoke and promotion workflow that protects production SSO.

## License
- Proprietary. See `LICENSE.md` and `NOTICE.md`.
