# Lucky Draw SaaS

Multi-tenant platform for raffles, lucky draws, and ticket-selling events.

## Stack

- Next.js 15 (App Router)
- TypeScript, Tailwind CSS v4, shadcn/ui
- Prisma + PostgreSQL (schema in Phase 2)
- Auth.js (wired in Phase 2)

## Getting started

```bash
npm install
cp .env.example .env
npm run docker:up    # PostgreSQL on localhost:5432
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Design system showcase: [http://localhost:3000/design-system](http://localhost:3000/design-system)

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start dev server (Turbopack) |
| `npm run build`     | Production build             |
| `npm run lint`      | ESLint                       |
| `npm run format`    | Prettier write               |
| `npm run typecheck` | TypeScript check             |
| `npm run docker:up` | Start Postgres via Docker    |

## Project structure

```
app/           Next.js routes
components/    UI + providers
lib/           Utilities, Prisma client
modules/       Feature modules (Phase 2+)
services/      Business logic
repositories/  Data access
hooks/         React hooks
store/         Zustand stores
validators/    Zod schemas
types/         Shared TypeScript types
prisma/        Database schema
middleware.ts  Request middleware
```

## Design reference

UI mockups and tokens: [`.cursor/design-reference/README.md`](.cursor/design-reference/README.md)

- `dashboard.png` — sidebar, KPIs, quick actions
- `event-form.png` — event form sections (Phase 4)

## Implementation phases

See [`.cursor/planning/plan.md`](.cursor/planning/plan.md) for the full phase-by-phase plan.

**Current:** Phase 2 complete · Design reference applied · **Next:** Phase 3 (polish dashboard shell)
