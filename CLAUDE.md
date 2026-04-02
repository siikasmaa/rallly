# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rallly is a self-hosted doodle poll alternative for scheduling meetings. Built with Next.js 12, Prisma, tRPC, and TailwindCSS. Licensed under AGPLv3.

## Common Commands

```bash
yarn dev              # Start dev server (with Tailwind watch mode)
yarn build            # Production build
yarn start            # Run production server
yarn lint             # ESLint
yarn lint:tsc         # TypeScript type checking
yarn test             # Run Playwright E2E tests
yarn prisma migrate deploy   # Apply database migrations
yarn prisma generate         # Regenerate Prisma client (also runs on postinstall)
```

Playwright requires browser install first: `yarn playwright install --with-deps chromium`

## Architecture

**Single Next.js app** (not a monorepo). All source code is in `src/`.

### Path Aliases
- `@/*` maps to `src/*`
- `~/*` maps to project root ``./*``

### API Layer (tRPC)
- All API routes go through a single tRPC handler at `src/pages/api/trpc/[trpc].ts`
- Server context (session handling): `src/server/context.ts`
- Routers: `src/server/routers/` — polls, participants, comments, session, login, user, verification, demo
- Client setup: `src/utils/trpc.ts`
- Uses SuperJSON for serialization and React Query for client-side caching

### Database (Prisma + PostgreSQL)
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- Models: User, Poll, Participant, Option, Vote, Comment
- Soft-delete middleware for Polls: `prisma/middlewares/softDeleteMiddleware.ts`
- Uses `citext` extension for case-insensitive emails
- Poll has two URL identifiers: `participantUrlId` (public sharing) and `adminUrlId` (admin access)

### Authentication
- iron-session with encrypted cookies (cookie name: `rallly-session`)
- Guest user system with session token encryption via `jose`
- Auth utilities: `src/utils/auth.ts`
- `SECRET_PASSWORD` env var (min 32 chars) for session encryption

### Pages & Rendering
- SSR pages use `getServerSideProps` for auth checks and translations
- Heavy interactive components (poll UI) loaded with `dynamic()` and `ssr: false`
- Key pages: `poll.tsx` (main poll view), `new.tsx` (create poll), `demo.tsx`, `login.tsx`, `profile.tsx`

### Internationalization
- next-i18next with 16 locales (en default)
- Translation files: `public/locales/{locale}/{namespace}.json`
- Namespaces: common, app, errors, homepage
- Locale detection: cookie (NEXT_LOCALE) -> Accept-Language header -> default (en)
- Pages include translations via `serverSideTranslations(locale, ['common', 'app'])`

### Email
- Nodemailer for sending, Eta templates for rendering
- Email utilities: `src/utils/send-email.ts`

## Environment Variables

Required (see `sample.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_PASSWORD` — Session encryption key (min 32 chars)
- `NEXT_PUBLIC_BASE_URL` — App URL (default: http://localhost:3000)
- `SUPPORT_EMAIL` — FROM address for outgoing emails
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PWD` — Mail server config

## Code Style

- TypeScript strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- ESLint with next/core-web-vitals, import sorting (`eslint-plugin-simple-import-sort`)
- Prettier with double quotes, trailing commas, 2-space indent
- TailwindCSS for all styling (with `prettier-plugin-tailwindcss` for class sorting)

## Docker

Multi-stage Dockerfile. `docker-compose.yml` runs the app + PostgreSQL 14.2. Startup script (`docker_start.sh`) runs migrations then starts the server.
