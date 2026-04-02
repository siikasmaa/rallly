# Migration Plan: Next.js → Astro + Cloudflare + Bun

Tracking document for migrating Rallly from its current stack to:
- **Runtime/tooling:** Bun (replaces yarn + Node.js)
- **Frontend framework:** Astro (replaces Next.js 12)
- **Backend/hosting:** Cloudflare Workers + Pages
- **Database:** Cloudflare D1 (replaces PostgreSQL via Prisma)

---

## Current Stack Summary

| Layer | Current | Target |
|---|---|---|
| Package manager | Yarn | Bun |
| Runtime | Node.js 16 | Bun / Cloudflare Workers runtime |
| Framework | Next.js 12 (Pages Router) | Astro |
| API | tRPC v9 via Next.js API routes | tRPC v11 via Astro endpoints or Cloudflare Workers |
| ORM | Prisma 4.1 (PostgreSQL) | Drizzle ORM (D1-native) |
| Database | PostgreSQL 14.2 | Cloudflare D1 (SQLite) |
| Auth/session | iron-session (encrypted cookies) | Astro middleware + cookie-based sessions |
| i18n | next-i18next | astro-i18n or Paraglide |
| Email | Nodemailer + Eta templates | Cloudflare Email Workers or external SMTP via fetch |
| Hosting | Docker / Vercel | Cloudflare Pages + Workers |
| Analytics | next-plausible | Plausible (framework-agnostic script) |
| Error tracking | @sentry/nextjs | @sentry/cloudflare or @sentry/browser |

---

## Phase 0: Preparation

Foundation work before any migration begins.

- [x] Create a new branch `migration/astro-cloudflare`
- [x] Audit all 52 production dependencies for Cloudflare Workers compatibility (no Node.js-only APIs)
- [x] Document all environment variables and their Cloudflare equivalents (Workers secrets, Pages env)
- [ ] Set up a Cloudflare account with Pages project, D1 database, and Workers
- [x] Create a `wrangler.toml` configuration file
- [x] Identify React components that are purely presentational vs. those needing client interactivity

### Node.js API usage that must be replaced

These files use Node.js APIs unavailable in Cloudflare Workers:

| File | API | Replacement |
|---|---|---|
| `src/utils/api-utils.ts` | `fs.readFileSync`, `path.resolve` | Inline templates or bundled imports |
| `src/utils/send-email.ts` | `nodemailer` (net/tls) | Cloudflare Email Workers or MailChannels API |
| `prisma/db.ts` | Prisma global singleton | Drizzle with D1 binding |
| `src/utils/auth.ts` | `iron-session` (crypto) | Web Crypto API-based session encryption |

---

## Phase 1: Bun Migration

Switch from yarn/Node.js to Bun for all tooling.

- [x] Install Bun and verify version compatibility
- [ ] Run `bun install` to generate `bun.lockb` from existing `package.json`
- [ ] Remove `yarn.lock`
- [x] Update all `package.json` scripts to use `bun` where applicable
  - `"dev"` → `bun run dev` (or just `bun dev`)
  - `"build"` → `bun run build`
  - `"test"` → `bun run test` (Playwright still runs under its own runtime)
  - `"postinstall"` → `bunx prisma generate` (temporary, until Drizzle migration)
- [ ] Verify `bun run dev`, `bun run build`, `bun run lint`, `bun run lint:tsc` all pass
- [x] Update CI workflow (`.github/workflows/ci.yml`) to use Bun instead of Node.js 16
- [x] Update Dockerfile to use `oven/bun` base image (temporary, will be removed in Phase 5)
- [x] Update `docker_start.sh` to use `bun` commands
- [ ] Verify Playwright tests still pass under Bun

---

## Phase 2: Database Migration (PostgreSQL → Cloudflare D1)

D1 is SQLite-based. This requires ORM and schema changes.

### 2a: Replace Prisma with Drizzle ORM

Drizzle has first-class D1 support; Prisma's D1 adapter is experimental.

- [x] Install `drizzle-orm` and `drizzle-kit`
- [x] Translate Prisma schema (`prisma/schema.prisma`) to Drizzle schema file(s) in `src/db/schema.ts`
  - **Models to convert:** User, Poll, Participant, Option, Vote, Comment
  - **Enums:** PollType (date), VoteType (yes, no, ifNeedBe) → SQLite text with CHECK constraints
  - **Note:** D1/SQLite has no `citext` type — implement case-insensitive email via `COLLATE NOCASE` or `lower()` at query time
- [x] Rewrite `prisma/middlewares/softDeleteMiddleware.ts` as Drizzle query wrapper or utility functions
  - Intercept Poll deletes → set `deleted = true, deletedAt = now()`
  - Auto-filter `deleted = false` on Poll reads
- [ ] Create D1 migration files via `drizzle-kit generate`
- [x] Create `src/db/index.ts` — Drizzle client factory that accepts D1 binding
- [x] Remove Prisma dependencies (`prisma`, `@prisma/client`)
- [ ] Remove `prisma/` directory (schema, migrations, middlewares, db.ts)
- [x] Remove `postinstall` script (no more `prisma generate`)

### 2b: Rewrite data access layer

All tRPC routers use Prisma directly. Each must be rewritten.

- [x] `src/server/routers/polls.ts` — CRUD for polls, options, admin/participant URL lookups
- [x] `src/server/routers/polls/participants.ts` — list, add, update, delete participants
- [x] `src/server/routers/polls/comments.ts` — list, add, delete comments
- [x] `src/server/routers/polls/verification.ts` — poll email verification
- [x] `src/server/routers/polls/demo.ts` — demo poll creation
- [x] `src/server/routers/session.ts` — session get/destroy
- [x] `src/server/routers/login.ts` — login/token procedures (no Prisma usage)
- [x] `src/server/routers/user.ts` — user profile updates
- [x] `src/pages/api/house-keeping.ts` — cron cleanup (raw SQL delete of old soft-deleted polls)

### 2c: Data differences to handle

| PostgreSQL | D1 (SQLite) | Action |
|---|---|---|
| `citext` for emails | Not available | Use `COLLATE NOCASE` or `lower()` |
| `@default(cuid())` | Not native | Generate CUIDs in application code |
| `@updatedAt` | Not native | Set `updatedAt` manually in mutations |
| Hash indexes | Not supported | Use standard B-tree indexes |
| `$executeRaw` | D1 `prepare().run()` | Rewrite raw queries |
| Enums (`PollType`, `VoteType`) | TEXT columns | Add CHECK constraints |

---

## Phase 3: Framework Migration (Next.js → Astro)

### 3a: Project scaffolding

- [x] Initialize Astro project in repo root (`astro.config.mjs`)
- [x] Configure Astro with `@astrojs/react` integration (keep existing React components)
- [x] Configure Astro with `@astrojs/cloudflare` adapter for SSR
- [x] Configure Astro with `@astrojs/tailwind` integration
- [x] Set up path aliases in Astro config and `tsconfig.json` (`@/*` → `src/*`)
- [x] Move/adapt `tailwind.config.js` (custom theme: colors, animations, fonts, screens)
- [x] Move `postcss.config.js`
- [x] Set up `public/` static assets (favicons, images, locale JSON files)

### 3b: Routing migration

Next.js pages → Astro pages. Astro uses file-based routing in `src/pages/`.

| Next.js Page | Route | Astro Equivalent | Notes |
|---|---|---|---|
| `src/pages/home.tsx` | `/` | `src/pages/index.astro` | Static, i18n |
| `src/pages/new.tsx` | `/new` | `src/pages/new.astro` | SSR, session check |
| `src/pages/poll.tsx` | `/poll?urlId=X` | `src/pages/poll/[urlId].astro` | SSR, dynamic |
| `src/pages/demo.tsx` | `/demo` | `src/pages/demo.astro` | SSR |
| `src/pages/login.tsx` | `/login` | `src/pages/login.astro` | SSR, session merge |
| `src/pages/profile.tsx` | `/profile` | `src/pages/profile.astro` | SSR, session |
| `src/pages/404.tsx` | 404 | `src/pages/404.astro` | Static |
| `src/pages/privacy-policy.tsx` | `/privacy-policy` | `src/pages/privacy-policy.astro` | Static |

- [x] Create Astro page files for each route above
- [x] Migrate URL rewrites from `next.config.js` to Astro routing
  - `/p/:urlId` → poll participant view
  - `/admin/:urlId` → poll admin view
  - `/verify/:urlId/code/:code` → verification
- [x] Remove `_app.tsx` — move global providers into an Astro layout
- [x] Remove `_document.tsx` — move head/meta/fonts into Astro layout `<head>`
- [x] Remove `_error.tsx` — use Astro error pages

### 3c: Middleware migration

- [x] Rewrite `src/middleware.ts` from Next.js Edge middleware to Astro middleware (`src/middleware.ts`)
  - Locale detection (cookie `NEXT_LOCALE` → Accept-Language header → default `en`)
  - Session initialization (guest user creation)
- [x] Ensure middleware has access to D1 binding via `context.locals`

### 3d: Component hydration strategy

Next.js renders everything server-side by default. Astro renders nothing client-side by default. Each interactive React component needs an explicit hydration directive.

- [x] Audit all components in `src/components/` for interactivity requirements
- [x] Components that are **static** (no useState, no event handlers) → render in `.astro` files directly or as `client:none`
- [x] Components that need **immediate interactivity** → `client:load`
  - Poll voting UI, forms, modals, toast notifications
- [x] Components that can **defer hydration** → `client:visible` or `client:idle`
  - Comments section, calendar view, Crisp chat widget
- [x] Replace all `next/dynamic` with `ssr: false` → Astro `client:only="react"` directive
  - `CrispChat` (in _app.tsx)
  - `Poll` component (in poll.tsx)
  - `CreatePoll` component (in new.tsx)
  - `Popover` component (in page-layout.tsx)

### 3e: Next.js API replacement

- [ ] Replace `next/link` → `<a>` tags (Astro handles prefetching natively)
- [ ] Replace `next/router` (`useRouter`) → standard `window.location` or a lightweight router
  - Query params: `useRouter().query` → `Astro.url.searchParams` (server) / `URLSearchParams` (client)
  - Navigation: `router.push()` → `window.location.href` or `navigate()`
  - Pathname: `router.pathname` → `Astro.url.pathname` (server) / `window.location.pathname` (client)
- [x] Replace `next/head` → Astro `<head>` in layouts
- [ ] Replace `next/image` → `<img>` or `astro:assets` (not heavily used currently)
- [ ] Remove `next.config.js`, `next-i18next.config.js`

### 3f: i18n migration

- [x] Choose Astro i18n approach (built-in `i18n` routing config or `astro-i18next`)
- [x] Configure locale routing for 16 locales (cs, da, de, en, es, fa, fr, hu, it, ko, nl, pl, pt, pt-BR, sk, sv, zh)
- [ ] Migrate translation JSON files (`public/locales/{locale}/*.json`) to new i18n system
- [ ] Replace `useTranslation()` hook calls in React components
- [ ] Replace `serverSideTranslations()` calls in page data loading
- [ ] Remove `next-i18next` and `react-i18next` dependencies

---

## Phase 4: API & Backend on Cloudflare Workers

### 4a: tRPC on Cloudflare

- [ ] Upgrade tRPC from v9 to v11 (v9 is EOL; v11 has fetch adapter for Workers)
  - v9 uses `createReactQueryHooks` → v11 uses `createTRPCReact`
  - v9 uses `.merge()` for routers → v11 uses `.router({ ... })` with `mergeRouters`
  - v9 `createRouter()` → v11 `initTRPC.create()` with context
- [x] Replace `@trpc/next` adapter → `@trpc/server/adapters/fetch` (works with Workers)
- [x] Create Astro API endpoint at `src/pages/api/trpc/[...trpc].ts` using fetch adapter
- [x] Update tRPC context to receive D1 binding from Cloudflare env
- [x] Update `src/utils/trpc.ts` client configuration for new tRPC version
- [x] Replace `superjson` transformer if needed (should still work)
- [ ] Update all component-level tRPC usage (hook API changes between v9 and v11)

### 4b: Authentication on Cloudflare

iron-session depends on Node.js crypto. Replace with Web Crypto API-compatible solution.

- [x] Implement cookie-based session using Web Crypto API (`crypto.subtle`)
  - Encrypt/decrypt session data with AES-GCM
  - Sign cookies with HMAC-SHA256
- [x] Store session secrets as Cloudflare Workers secrets (`wrangler secret put SECRET_PASSWORD`)
- [x] Rewrite `createToken()` / `decryptToken()` using Web Crypto API
- [x] Rewrite guest user creation and session initialization
- [x] Rewrite `mergeGuestsIntoUser()` to use Drizzle queries
- [x] Remove `iron-session` and `jose` dependencies

### 4c: Email on Cloudflare

Nodemailer requires Node.js `net`/`tls` modules, unavailable in Workers.

- [x] Evaluate options: MailChannels API (free for Cloudflare Workers) selected
- [x] Inline email HTML templates as template literal strings (remove `fs.readFileSync` usage)
  - Templates: `login.html`, `new-poll.html`, `new-poll-verified.html`, `new-participant.html`, `new-comment.html`
- [x] Rewrite `src/utils/send-email.ts` to use MailChannels fetch API
- [x] Remove `nodemailer` and `eta` dependencies

### 4d: Sentry on Cloudflare

- [ ] Replace `@sentry/nextjs` with `@sentry/cloudflare` (for Workers) + `@sentry/browser` (for client)
- [ ] Configure Sentry in Astro middleware for server-side error capture
- [x] Remove `sentry.client.config.js`, `sentry.server.config.js` (deferred to cleanup)

### 4e: House-keeping / cron

- [x] Migrate `src/pages/api/house-keeping.ts` to Astro API endpoint (Cloudflare Workers compatible)
- [x] Configure cron schedule in `wrangler.toml`
- [x] Rewrite poll cleanup query for D1/Drizzle

---

## Phase 5: Deployment & Infrastructure

- [x] Configure `wrangler.toml` with:
  - D1 database binding
  - Workers secrets (SECRET_PASSWORD)
  - Pages configuration
  - Cron triggers for house-keeping
- [ ] Set up Cloudflare Pages deployment (GitHub integration or `wrangler pages deploy`)
- [ ] Create D1 migration workflow (`wrangler d1 migrations apply`)
- [x] Update `.github/workflows/ci.yml`:
  - Use Bun for install/build/lint/type-check
  - Run Playwright against Astro preview server
  - Removed PostgreSQL dependency (using D1 now)
- [x] Remove Docker files (`Dockerfile`, `docker-compose.yml`, `docker_start.sh`, `.dockerignore`)
- [x] Remove `.github/workflows/docker-image.yml`
- [ ] Update `README.md` with new setup instructions
- [x] Update `CLAUDE.md` with new commands and architecture
- [x] Update `sample.env` for new stack

---

## Phase 6: Cleanup

- [x] Remove all Next.js dependencies (`next`, `eslint-config-next`, `@next/bundle-analyzer`)
- [x] Remove all Prisma dependencies and files
- [x] Remove `next-i18next` (kept `react-i18next` — works standalone)
- [x] Remove `iron-session`, `jose`
- [x] Remove `nodemailer`, `eta`
- [x] Remove `@sentry/nextjs`
- [x] Remove `next-plausible`
- [x] Remove `@svgr/webpack`
- [x] Remove Next.js config files (`next.config.js`, `next-i18next.config.js`, `sentry.*.config.js`)
- [x] Upgrade React to v18+ (Astro supports it)
- [ ] Upgrade remaining dependencies to latest versions
- [x] Update TypeScript config for Astro
- [ ] Run full E2E test suite and fix regressions
- [x] Update `sample.env` with new/changed variables
- [x] Replace all `next/link` → `<a>` tags in 7 components
- [x] Replace all `next/router` → `window.location` in 6 components
- [x] Replace all `next/head` → removed (handled in Astro layouts)
- [x] Replace all `next/dynamic` → `React.lazy`
- [x] Replace `next-plausible` hooks with no-ops in 9 components
- [x] Replace `next-i18next` imports → `react-i18next` in 39 components
- [x] Remove old Next.js pages (`_app.tsx`, `_document.tsx`, `_error.tsx`, etc.)
- [x] Remove old email template HTML files
- [x] Delete `src/utils/with-page-translations.ts`

---

## Dependency Mapping

Packages that change or are removed during migration:

| Current Package | Action | Replacement |
|---|---|---|
| `next` | Remove | `astro` |
| `@trpc/next` | Remove | `@trpc/server` fetch adapter |
| `@trpc/*@9.x` | Upgrade | `@trpc/*@11.x` |
| `prisma`, `@prisma/client` | Remove | `drizzle-orm`, `drizzle-kit` |
| `iron-session` | Remove | Custom Web Crypto session |
| `jose` | Remove | Web Crypto API |
| `nodemailer` | Remove | Fetch-based email API |
| `eta` | Remove | Template literals |
| `next-i18next`, `react-i18next` | Remove | Astro i18n solution |
| `@sentry/nextjs` | Remove | `@sentry/cloudflare`, `@sentry/browser` |
| `next-plausible` | Remove | `<script>` tag |
| `eslint-config-next` | Remove | `eslint-plugin-astro` |
| `@next/bundle-analyzer` | Remove | Astro build analysis |
| `@svgr/webpack` | Remove | Astro SVG handling |
| `react-query@3` | Upgrade | `@tanstack/react-query@5` (used by tRPC v11) |
| `react@17` | Upgrade | `react@18+` |
| `wait-on` | Remove | Astro dev server ready detection |
| `tailwindcss` | Keep | Via `@astrojs/tailwind` |
| `framer-motion` | Keep | Works in React islands |
| `react-hook-form` | Keep | Works in React islands |
| `dayjs` | Keep | Framework-agnostic |
| `zod` | Keep | Framework-agnostic |
| `clsx` | Keep | Framework-agnostic |
| `nanoid` | Keep | Framework-agnostic |
| `axios` | Evaluate | May replace with native `fetch` |

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| D1 SQLite limitations vs PostgreSQL (no CITEXT, no hash indexes, limited concurrent writes) | High | Test all queries early; implement case handling in app layer |
| D1 row/database size limits (500MB free, 10GB paid) | Medium | Monitor data growth; archive old polls |
| tRPC v9→v11 breaking changes across all components | High | Migrate tRPC incrementally; keep old and new routers temporarily |
| Cloudflare Workers CPU time limits (10ms free, 30s paid) | Medium | Profile heavy operations; offload to Queues if needed |
| Email delivery reliability changing from SMTP to API | Medium | Test thoroughly; keep SMTP as fallback option |
| Loss of Prisma's type safety during Drizzle migration | Medium | Drizzle has comparable type safety; write tests for all queries |
| i18n behavior differences (URL structure, locale detection) | Low | Maintain same URL patterns; test all 16 locales |
