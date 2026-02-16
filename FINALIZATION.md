# Finalization Checklist

This repo is production-ready once the following end-to-end checks and handoffs are complete. Treat it like a senior delivery: validate data flows, automation, governance, and documentation before declaring the work “final”.

## 1. Data & Integration Preconditions
- Run the **Notebook → Neon → App** sync and verify counts for `entrestate_master`, `media_enrichment`, `market_scores_v1`, and `agent_inventory_view_v1` as described in `docs/notebook-brief.md:21-81`.
- Confirm exclusions for `lelwa/mashroi` and keep `price_aed` numeric. Do not change Neon schema/functions.
- Recompute `market_scores_v1`, verify `agent_inventory_view_v1` reflects the latest inventory + scores, and write the `system_healthcheck` row with pass/fail metrics.
- Execute the `docs/data-sync-checklist.md` workflow, logging any failures before proceeding.

## 2. CI, Smoke, and Contract Tests
- Ensure GitHub Actions run the nightly DB contract test (`tests/db-contract.test.ts` against `NEON_DATABASE_URL`).
- Wire the **Deploy → Wait → Smoke (Preview)** workflow from `docs/smoke-finalization-guide.md:49-112`. Confirm the deploy job surfaces the preview URL and the smoke job uses `./smoke.sh`.
- Store `VERCEL_*` secrets and `VERCEL_PROTECTION_BYPASS` only in GitHub Actions secrets. Do not add bypass tokens to runtime `.env`.
- Add `./smoke.sh` (or replace existing script) with the hardened version from `docs/smoke-finalization-guide.md:155-255`. Smoke failures must provide a `requestId`, check for leaked errors, and guard auth failures.
- Manual `workflow_dispatch` smoke runs should accept a `base_url` and optionally use the bypass header; this covers ad-hoc validation.

## 3. Deployment & Promotion
- Ensure Vercel production remains behind SSO (Vercel Authentication) per `docs/smoke-finalization-guide.md:38-54`.
- Primary path: push to `main` → preview deployment → smoke tests → `vercel promote` or merge into production branch.
- If `main` cannot become production, point production branch to an idle branch and use `npx vercel promote` (include `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets).
- Optional: map a stable staging domain (e.g., `staging.example.com`) to Preview deployments so automation uses a consistent base URL.
- For fallback, use the Protection Bypass token scoped to Preview, stored only in CI, and rotated quarterly.

## 4. Security & Governance
- Production SSO must stay enabled; never expose bypass tokens or SSO secrets outside CI.
- Control Preview/staging access via password or limited domains; minimize exposure.
- Rotate `VERCEL_TOKEN` and bypass tokens every 90 days and log changes in your security tracker.
- Ensure smoke/contract tests surface diagnostics without leaking Prisma/DB stack traces (`ERROR_LEAK_PATTERN` guard).

## 5. Documentation & Handoff
- Document the finalized deployment + smoke flow in `README.md` or a dedicated `docs/` file (e.g., `docs/smoke-finalization-guide.md`).
- Confirm the nightly DB contract plan, manual smoke workflow, smoke script security guarantees, and definition of done from `docs/smoke-finalization-guide.md:114-255` are in the documentation.
- Update the notebook master brief to mention the finalized automation if the consumer (Notebook agent) needs to know.
- Inform stakeholders that smoke runs block promotion unless they succeed, and share any bypass token rotation SOPs.

## 6. Definition of Done
1. The nightly DB contract test passes on schedule.
2. Preview deployments run hardened smoke tests before promotion.
3. Production always demands SSO; bypass access is temporary and scoped.
4. Smoke failures report request IDs and avoid leaking internal errors.
5. Documentation describes the deployment/smoke/promotion flow and any manual run instructions.

## Suggested Next Steps
1. Confirm whether preview-as-staging plus promotion works or if a dedicated staging project is necessary.
2. Decide the exact access model for previews (public, password-guarded, or bypass token).
3. Implement or update `./smoke.sh`, GitHub Actions workflows, and the Vercel configuration outlined above.
