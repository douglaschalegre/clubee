# AGENTS.md

**Project Overview**
Clubee is a single Next.js app (App Router) that includes both the frontend UI and backend route handlers. The repo is organized like a monorepo, but everything lives in this one Next.js project.

**Repo Layout**
- `app/` Next.js App Router pages, layouts, and UI routes.
- `app/api/` Backend route handlers (clubs, auth, stripe).
- `components/` Shared UI components.
- `lib/` Shared utilities, data access, and integrations.
- `prisma/` Prisma schema and migrations.

**Local Development**
- Install deps: `bun install`
- Run dev server: `bun dev`
- Default dev URL: `http://localhost:3000`
- Prisma client output: `lib/generated/prisma`

**Environment Variables**
- See `.env.example` for the full list.
- Neon Postgres: `DATABASE_URL`, `DIRECT_URL`
- Auth0: `APP_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLATFORM_FEE_PERCENT`
- Cloudflare R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Database: Neon + Prisma**
- Prisma schema: `prisma/schema.prisma`
- Prisma client output: `lib/generated/prisma`
- Runtime DB connection uses `DATABASE_URL` with Prisma Neon adapter in `lib/db.ts`
- Migrations use `DIRECT_URL` in `prisma.config.ts`
- Generate client: `bun run prisma:generate`
- Run migrations: `bun run prisma:migrate`
- Open studio: `bun run prisma:studio`

**Stripe**
- Stripe SDK config: `lib/stripe.ts`
- Checkout route: `app/api/stripe/checkout/route.ts`
- Portal route: `app/api/stripe/portal/route.ts`
- Webhook route: `app/api/stripe/webhook/route.ts`
- Webhook secret: `STRIPE_WEBHOOK_SECRET`

**Conventions**
- Package manager: Bun (`bun.lock`)
- Node version: 20.x (`.nvmrc`, `package.json` engines)
- TypeScript strict mode is enabled.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Do not commit secrets; update `.env.example` when adding new env vars.

**Testing/Lint**
- Lint: `bun run lint`
- No test runner configured.
