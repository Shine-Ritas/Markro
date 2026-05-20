# Other — Notes, decisions & agent handoff

> Use this file for anything that is **not** a bug: env setup, architecture decisions, blockers, and phase handoffs.  
> Cursor agents should **read this before each phase** and **append** after completing work.

---

## How to use

| Section           | When to update                                        |
| ----------------- | ----------------------------------------------------- |
| **Current phase** | Start / finish each phase                             |
| **Environment**   | New env vars, ports, Docker changes                   |
| **Decisions**     | Non-obvious architectural choices                     |
| **Blockers**      | Waiting on external setup (Google Console, DNS, etc.) |
| **Handoff log**   | End of each Cursor session                            |

---

## Current phase

| Field            | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Active phase** | Phase 1 complete → start Phase 2                                          |
| **Last updated** | 2026-05-20                                                                |
| **Next action**  | `Implement Phase 2 from @.cursor/planning/plan.md — include Google OAuth` |

---

## Environment & secrets

> Never commit real secrets. Document **names** only.

### App

| Variable             | Purpose                    | Phase |
| -------------------- | -------------------------- | ----- |
| `DATABASE_URL`       | PostgreSQL connection      | 2     |
| `AUTH_SECRET`        | Auth.js session encryption | 2     |
| `AUTH_URL`           | Canonical app URL          | 2     |
| `AUTH_GOOGLE_ID`     | Google OAuth client ID     | 2     |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | 2     |

### Google OAuth setup (Phase 2)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. **Authorized JavaScript origins:** `http://localhost:3000` (dev)
4. **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
5. Production: repeat with production domain (Phase 15)

### Local services

| Service       | URL / port              | Notes                                          |
| ------------- | ----------------------- | ---------------------------------------------- |
| Next.js dev   | `http://localhost:3000` | `npm run dev`                                  |
| PostgreSQL    | `localhost:5432`        | `npm run docker:up` — user/pass/db: `luckdraw` |
| Design system | `/design-system`        | UI primitive showcase                          |

---

## Architecture decisions

| Date       | Decision                               | Rationale                                                                                        |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 2026-05-20 | Auth.js v5 for email + Google          | Single session model, Prisma adapter, OAuth account linking                                      |
| 2026-05-20 | Google OAuth in Phase 2                | Social login required early; same phase as credentials                                           |
| 2026-05-20 | No payment gateways until future phase | Per product scope                                                                                |
| 2026-05-20 | Prisma 6.x (not 7)                     | Prisma 7 requires `prisma.config.ts`; v6 matches standard Next.js tutorials until Phase 2 schema |
| 2026-05-20 | shadcn base-nova + Base UI             | Dialog/Sheet/Dropdown use `@base-ui/react` render prop API                                       |
| 2026-05-20 | Violet primary accent                  | Brand color in `app/globals.css` oklch hue ~285                                                  |

---

## Blockers

| ID     | Phase | Blocker | Owner | Status |
| ------ | ----- | ------- | ----- | ------ |
| _none_ | —     | —       | —     | —      |

---

## Tech debt & follow-ups

| Item   | Phase introduced | Priority |
| ------ | ---------------- | -------- |
| _none_ | —                | —        |

---

## Phase handoff log

> Newest entries at the top.

### Template

```markdown
#### Phase N — YYYY-MM-DD

**Completed:**

-

**Not done / deferred:**

-

**Files touched (high level):**

-

**How to verify:**

1.

**Notes for next agent:**

-
```

---

#### Phase 1 — 2026-05-20

**Completed:**

- Next.js 15 + TypeScript strict + Tailwind v4 + shadcn/ui
- ESLint, Prettier, Husky, lint-staged
- Core packages (Prisma 6, Auth.js beta, Zod, RHF, Zustand, TanStack Query, Framer Motion, Recharts)
- Folder structure, theme (dark/light), design system at `/design-system`
- Docker Compose PostgreSQL, `.env.example`

**Not done / deferred:**

- Auth wiring, database schema, Google OAuth → Phase 2

**Files touched (high level):**

- `app/`, `components/`, `lib/`, `prisma/schema.prisma`, `middleware.ts`, `docker-compose.yml`, config files

**How to verify:**

1. `npm run docker:up` (optional)
2. `npm run dev` → http://localhost:3000
3. Open http://localhost:3000/design-system
4. `npm run lint && npm run build`

**Notes for next agent:**

- Run `cp .env.example .env` and set `AUTH_SECRET` in Phase 2
- Replace placeholder `prisma/schema.prisma` with full multi-tenant schema
- Add `@auth/prisma-adapter` when wiring Auth.js

---

#### Initial setup — 2026-05-20

**Completed:**

- Planning docs restructured for Cursor (`plan.md`, `bug_report.md`, `other.md`)
- Google OAuth added to Phase 2 requirements

**Not done / deferred:**

- All implementation phases (1–15)

**Notes for next agent:**

- Start with Phase 1 only; do not implement Google OAuth until Phase 2
- After Phase 2, document actual redirect URIs and any Google Console quirks above

---

## Useful links

| Resource           | URL                                               |
| ------------------ | ------------------------------------------------- |
| Auth.js docs       | https://authjs.dev                                |
| Google OAuth setup | https://console.cloud.google.com/apis/credentials |
| Prisma docs        | https://www.prisma.io/docs                        |
| Next.js 15 docs    | https://nextjs.org/docs                           |
| shadcn/ui          | https://ui.shadcn.com                             |

---

## Session scratchpad

_Free-form notes during development — clear when phase ships._

```
Phase 1 shipped. Package name: luckdraw
```
