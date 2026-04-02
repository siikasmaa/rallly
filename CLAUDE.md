# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rallly is a scheduling tool (doodle poll alternative) for group meetings. Built with Astro, React, Drizzle ORM, tRPC, and TailwindCSS. Deployed on Cloudflare Workers/Pages with D1 database. Licensed under AGPLv3.

## Common Commands

```bash
bun install           # Install dependencies
bun run dev           # Start Astro dev server (port 4321)
bun run build         # Production build
bun run preview       # Preview production build
bun run lint          # ESLint
bun run lint:tsc      # Astro check + TypeScript type checking
bun run test          # Run Playwright E2E tests
bun run db:generate   # Generate Drizzle migrations
bun run db:migrate    # Apply Drizzle migrations
```

Playwright requires browser install first: `bunx playwright install --with-deps chromium`

## Architecture

**Astro app** with React islands for interactivity. Deployed on Cloudflare Pages + Workers.

### Path Aliases
- `@/*` maps to `src/*`
- `~/*` maps to project root ``./*``

### API Layer (tRPC)
- Astro API endpoint at `src/pages/api/trpc/[...trpc].ts` using fetch adapter
- Server context (session handling): `src/server/context.ts`
- Routers: `src/server/routers/` -- polls, participants, comments, session, login, user, verification, demo
- Client setup: `src/utils/trpc.ts`
- Uses SuperJSON for serialization and React Query for client-side caching

### Database (Drizzle + Cloudflare D1)
- Schema: `src/db/schema.ts`
- Client factory: `src/db/index.ts` (accepts D1 binding)
- Soft-delete utilities: `src/db/soft-delete.ts`
- Migration config: `drizzle.config.ts`
- Models: User, Poll, Participant, Option, Vote, Comment
- D1 is SQLite-based; uses integer timestamps, text enums, integer booleans

### Authentication
- Web Crypto API (AES-GCM) for session encryption
- Cookie-based sessions (`rallly-session`)
- Guest user system with encrypted tokens
- Auth utilities: `src/utils/auth.ts`
- `SECRET_PASSWORD` env var (min 32 chars) for encryption key

### Pages & Rendering
- Astro pages in `src/pages/` with file-based routing
- React components use `client:only="react"` or `client:load` hydration directives
- Layouts: `src/layouts/BaseLayout.astro`, `src/layouts/AppLayout.astro`
- Key routes: `/admin/[urlId]`, `/p/[urlId]`, `/new`, `/demo`, `/login`, `/profile`

### Internationalization
- Astro built-in i18n with 16 locales (en default)
- Translation files: `public/locales/{locale}/{namespace}.json`
- Locale detection: cookie (NEXT_LOCALE) -> Accept-Language header -> default (en)
- Middleware handles locale detection in `src/middleware.ts`

### Email
- MailChannels API (fetch-based, Cloudflare Workers compatible)
- Inlined HTML templates: `src/utils/email-templates.ts`
- Send utility: `src/utils/send-email.ts`

## Environment Variables

Required (see `sample.env`):
- `SECRET_PASSWORD` -- Session encryption key (min 32 chars)
- `PUBLIC_BASE_URL` -- App URL (default: http://localhost:4321)
- `SUPPORT_EMAIL` -- FROM address for outgoing emails
- `API_SECRET` -- House-keeping endpoint authentication

For Cloudflare deployment, set secrets via `wrangler secret put <NAME>`.

## Code Style

- TypeScript strict mode
- ESLint with import sorting (`eslint-plugin-simple-import-sort`)
- Prettier with double quotes, trailing commas, 2-space indent
- TailwindCSS for all styling

## Deployment

Cloudflare Pages + Workers. Configuration in `wrangler.toml`.
- Build: `bun run build`
- Deploy: `wrangler pages deploy ./dist`
- D1 migrations: `wrangler d1 migrations apply rallly-db`
- Cron: house-keeping runs daily at 6:00 AM UTC
