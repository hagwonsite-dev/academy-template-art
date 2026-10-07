# 팔레트 미술 스튜디오

작품 포트폴리오 · 피드백 · 전시 준비를 관리하는 미술학원

## Stack and local development

Next.js App Router, React, Hono API routes and strict TypeScript. Requires Node 22.19+.
Run npm ci, set APP_PASSWORD, then npm run dev. Open http://127.0.0.1:3100 with admin / your APP_PASSWORD.
Local SQLite receives fictional demo records. Use npm run build and npm start for production.

## Database and hosting

Fork and submit this repository to the academy catalog for Turso Tokyo + Vercel Seoul.
For manual hosting set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on the server. Existing Neon apps can keep DATABASE_URL.
Provision additive SQL migrations before deployment. Remote startup never creates tables or seed records.
The SQL migrations in prisma/migrations are immutable. Do not rewrite an applied migration.
PUBLIC_DEMO=1 with READ_ONLY=1 makes a public read-only demo; never use these flags with real private student data.

## Structure

- app/: server-rendered pages and Hono route adapter.
- components/: React TypeScript components; editing loads on demand.
- src/academy-config.ts: typed academy fields and workflow settings.
- src/operations.ts: validated mutations and atomic workflow guards.
- src/queries.ts: bounded SQL lists, aggregate metrics and searchable relation options.
- src/runtime.ts: private database reuse and per-request authorization.

Lists paginate and search on the server. Dashboards return six records with aggregate counts.
Images are HTTPS references, not uploads. Tuition is manual bookkeeping, not a payment gateway. Notices are stored records, not SMS/push.
Authentication currently uses one shared owner password; parent accounts and role permissions are not included.

## Verification

npm run lint
npm run typecheck
npm test
npm run build

Browser CI checks desktop, mobile, persisted registration and domain workflows.
The legacy IPC adapter is retained only for compatibility with the retired in-builder preview; npm scripts and Vercel always run Next.js.
