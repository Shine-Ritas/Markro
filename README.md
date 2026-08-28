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
npm run db:migrate   # apply Prisma migrations
npm run db:seed      # permissions, plans, ticket presets
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Design system showcase: [http://localhost:3000/design-system](http://localhost:3000/design-system)

## Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start dev server (Turbopack)                     |
| `npm run build`       | Production build                                 |
| `npm run lint`        | ESLint                                           |
| `npm run format`      | Prettier write                                   |
| `npm run typecheck`   | TypeScript check                                 |
| `npm run docker:up`   | Start Postgres via Docker                        |
| `npm run docker:down` | Stop Postgres                                    |
| `npm run db:generate` | Generate Prisma Client (`generated/prisma`)      |
| `npm run db:migrate`  | Create + apply a migration from schema changes   |
| `npm run db:push`     | Push schema to DB without a migration (dev only) |
| `npm run db:seed`     | Seed catalog data (`prisma/seed.ts`)             |

## Database (Prisma)

Schema: `prisma/schema.prisma`. Config: `prisma.config.ts` (reads `DATABASE_URL`). Client output: `generated/prisma`. Migrations: `prisma/migrations/`.

| Command                         | Description                                                                 |
| ------------------------------- | --------------------------------------------------------------------------- |
| `npm run db:generate`           | Regenerate the Prisma Client from the schema. Also runs on `npm install`.   |
| `npm run db:migrate`            | **Preferred.** Diff schema → write a migration → apply it locally.          |
| `npm run db:push`               | Sync schema to the DB with no migration file. Throwaway local use only.     |
| `npm run db:seed`               | Run seed (permissions, plans, ticket designs). Safe to re-run.              |
| `npx prisma migrate deploy`     | Apply pending migrations with no prompts (production / CI).                 |
| `npx prisma migrate status`     | List applied vs pending migrations.                                         |
| `npx prisma migrate reset`      | Drop local DB, re-apply all migrations, then seed. **Destructive.**         |
| `npx prisma validate`           | Validate schema + config.                                                   |
| `npx prisma format`             | Format `schema.prisma`.                                                     |
| `npx prisma studio`             | Browse/edit data in the browser.                                            |

After editing the schema, run `npm run db:migrate` and commit both `prisma/schema.prisma` and the new folder under `prisma/migrations/`. Full command notes: [`.cursor/planning/other.md`](.cursor/planning/other.md).

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
