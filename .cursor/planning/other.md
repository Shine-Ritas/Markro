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

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| **Active phase** | Phase 6 complete                                   |
| **Last updated** | 2026-06-09                                         |
| **Next action**  | `Implement Phase 7 from @.cursor/planning/plan.md` |

---

## Environment & secrets

> Never commit real secrets. Document **names** only.

### App

| Variable                          | Purpose                                    | Phase |
| --------------------------------- | ------------------------------------------ | ----- |
| `DATABASE_URL`                    | PostgreSQL connection                      | 2     |
| `AUTH_SECRET`                     | Auth.js session encryption                 | 2     |
| `AUTH_URL`                        | Canonical app URL                          | 2     |
| `AUTH_GOOGLE_ID`                  | Google OAuth client ID                     | 2     |
| `AUTH_GOOGLE_SECRET`              | Google OAuth client secret                 | 2     |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Set `true` when Google OAuth is configured | 2     |
| `STORAGE_PROVIDER`                | `local` (dev) or `s3` (cloud)              | —     |
| `STORAGE_S3_*`                    | S3-compatible bucket credentials           | —     |
| `IMAGE_UPLOAD_MAX_BYTES`          | Max image upload size (default 5MB)        | —     |

### Google OAuth setup (Phase 2)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth 2.0 Client ID** (Web application)
3. **Authorized JavaScript origins:** `http://localhost:3000` (dev)
4. **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
5. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in `.env` after adding credentials
6. Production: repeat with production domain (Phase 15)

**Verified redirect URI (dev):** `http://localhost:3000/api/auth/callback/google`

### Local services

| Service       | URL / port              | Notes                                          |
| ------------- | ----------------------- | ---------------------------------------------- |
| Next.js dev   | `http://localhost:3000` | `npm run dev`                                  |
| PostgreSQL    | `localhost:5432`        | `npm run docker:up` — user/pass/db: `luckdraw` |
| Design system | `/design-system`        | UI primitive showcase                          |
| Login         | `/login`                | Email + Google OAuth                           |
| Dashboard     | `/dashboard`            | Protected; tenant + RBAC context               |

---

## Architecture decisions

| Date       | Decision                                        | Rationale                                                                                                         |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 2026-05-20 | Auth.js v5 for email + Google                   | Single session model, Prisma adapter, OAuth account linking                                                       |
| 2026-05-20 | Google OAuth in Phase 2                         | Social login required early; same phase as credentials                                                            |
| 2026-05-20 | No payment gateways until future phase          | Per product scope                                                                                                 |
| 2026-05-20 | Prisma 6.x (not 7)                              | Prisma 7 requires `prisma.config.ts`; v6 matches standard Next.js tutorials until Phase 2 schema                  |
| 2026-05-20 | shadcn base-nova + Base UI                      | Dialog/Sheet/Dropdown use `@base-ui/react` render prop API                                                        |
| 2026-05-20 | Violet primary accent                           | Brand color in `app/globals.css` oklch hue ~285                                                                   |
| 2026-05-20 | JWT sessions + Prisma adapter                   | Credentials provider requires JWT; adapter stores OAuth accounts                                                  |
| 2026-05-20 | `allowDangerousEmailAccountLinking`             | Links Google to existing email/password users                                                                     |
| 2026-05-20 | Design reference in `.cursor/design-reference/` | Single source for UI mockups; dark LuckyDraw Pro theme applied before Phase 3                                     |
| 2026-05-20 | Ticket designs = JSON presets + per-event FK    | New card themes ship via seed/catalog; `events.ticket_design_id`; borders + full card in `theme`                  |
| 2026-05-20 | Ticket list views + Take photo export           | `grid` / `compact` / `showcase` / `table`; PNG via client capture for social sharing                              |
| 2026-06-09 | Swappable image storage (`lib/storage`)         | `STORAGE_PROVIDER=local                                                                                           | s3`; features use `image-upload.service`; yearly vendor swap = env only |
| 2026-06-09 | POS sales as `pos_sales` + `pos_sale_lines`     | Draft lines hold selected ticket IDs; complete sells those exact numbers, marks SOLD, receipt `RCP-YYYYMMDD-####` |
| 2026-06-09 | Per-event ISO currency (`events.currency_code`) | No USD default; event form picks code (THB, EUR, …); `formatMoney(cents, event.currencyCode)` via Intl            |
| 2026-06-09 | POS pick-your-numbers (Phase 6 replan)          | Staff/customer chooses specific lucky numbers + name/phone; `GET /api/pos/events/[id]/tickets` for picker         |
| 2026-06-09 | POS offline-ready (Phase 6 notes only)          | See handoff below; full offline sync deferred — use drafts API + idempotent complete when online                  |

---

## Blockers

| ID     | Phase | Blocker | Owner | Status |
| ------ | ----- | ------- | ----- | ------ |
| _none_ | —     | —       | —     | —      |

---

## Tech debt & follow-ups

| Item                                        | Phase introduced | Priority |
| ------------------------------------------- | ---------------- | -------- |
| Phase 5: real tickets + branded card render | 5                | High     |

---

## Phase handoff log

> Newest entries at the top.

### Template

```markdown
#### Phase N — YYYY-MM-DD

**Completed:**

- **Not done / deferred:**

- **Files touched (high level):**

- **How to verify:**

1.

**Notes for next agent:**

-
```

---

#### Phase 6 — POS (pick-your-numbers) — 2026-06-09

**Completed:**

- Schema: `pos_sales`, `pos_sale_lines`, `PosSaleStatus` (DRAFT / COMPLETED / CANCELLED)
- `services/pos.service.ts` — events, available-ticket list, drafts with explicit `ticketIds`, complete sale, daily stats
- APIs: `/api/pos/events`, `/api/pos/events/[eventId]/tickets`, `/api/pos/stats/today`, `/api/pos/sales`, complete/cancel
- `/dashboard/pos` tablet UI: event picker, **ticket number grid/search**, cart with selected numbers, customer name + phone (required), drafts, receipt dialog
- Daily sales widgets + staff name; sidebar POS enabled

**POS flow:**

```
Select event → pick ticket numbers (grid/search/quick-add) → customer name + phone → Complete sale → receipt
```

Draft `pos_sale_lines` store selected ticket IDs before complete. Complete validates tickets are still `AVAILABLE` and marks them `SOLD`.

**Offline-ready architecture (notes, not implemented):**

1. **Draft-first:** POS saves `DRAFT` sales with selected `ticketIds` server-side; client can queue sync when connectivity returns.
2. **Idempotent complete:** Pass client `Idempotency-Key` header on `POST .../complete` (follow-up) to avoid duplicate sales.
3. **Local cache:** Store `eventId`, `ticketIds`, customer fields in `localStorage` keyed by draft id; sync on `online` event.
4. **Inventory:** No `HELD` status yet — two drafts may overlap; second complete fails if a number was sold.
5. **Phase 8 customers:** Replace free-text `customerName` with `customers` FK when customer module ships.

**How to verify:**

1. Sign in → `/dashboard/pos`
2. Select published event with available tickets
3. Pick specific numbers (search or grid) → enter name + phone → **Complete sale**
4. Receipt lists exact ticket numbers; tickets move to SOLD on event detail
5. **Save draft** → resume from draft list → complete later

**Notes for Phase 7:**

- POS sells pre-generated numbered tickets only; draw engine is separate
- Public online buy flow will reuse pick-numbers UX in a later phase

---

#### Tickets dashboard enhancements — 2026-06-09

**Completed:**

- `/dashboard/tickets`: total ticket count, status breakdown, price-group summaries
- Aggregated table: Event, Ticket type, Total tickets, Price, Status (badge + count per group), Action
- Event detail **Table** view uses the same aggregated layout
- `getTenantTicketSummary` in `ticket.service.ts`

**How to verify:**

1. Sign in → `/dashboard/tickets` with generated tickets
2. Confirm summary cards, status counts, and price chips match table data
3. **View** opens QR dialog; **Modify** navigates to event detail

---

#### Phase 4 (ticket design & share) — 2026-05-20

**Completed:**

- `ticket_design_presets` + `events.ticket_design_id` / `ticket_list_view_default`
- Seed catalog: `prisma/seeds/ticket-designs.ts` (classic, minimal, glow, festive, corporate)
- Ticket appearance page: `/dashboard/events/[id]/appearance` (preset + default view)
- Event form: core fields only; link to appearance page on edit
- Event detail: tickets panel, view switcher, **Take photo** PNG export (1:1, 4:5, 16:9)
- `GET /api/ticket-designs`, `html-to-image` export

**How to verify:**

1. Event detail → Ticket appearance → pick design → save
2. Event detail → switch views → Take photo → Download PNG

---

#### Phase 4 — 2026-05-20

**Completed:**

- `Event` model + migration `20260520124015_add_events_phase4`
- Tenant-scoped APIs: `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/[id]`, publish/archive actions
- Admin UI: `/dashboard/events` (cards/table/calendar), new/edit/detail
- Public pages: `/org/[tenantSlug]`, `/org/[tenantSlug]/events/[eventSlug]` (no auth; ticket CTA placeholder)
- Sidebar Events enabled; dashboard wired to real event counts/upcoming list

**How to verify:**

1. Sign in as `demo@demo.com` / `Demo1234!`
2. Create event → publish → open public link from detail page
3. Visit `/org/demo-org` in incognito (no login)

**Notes for Phase 5:**

- Ticket model + sales UI on public event page

---

#### Phase 3 — 2026-05-20

**Completed:**

- `DashboardShell`: fixed sidebar, mobile sheet, header with breadcrumbs
- Tenant switcher, notification dropdown (audit-based), user menu with auth providers
- Recharts revenue + ticket charts, event status row, activity feed
- Framer Motion stagger, loading skeleton, session `authProviders`

**How to verify:**

1. Sign in → `/dashboard`
2. Resize to mobile — hamburger opens sidebar sheet
3. User menu shows Email and/or Google badge

**Notes for Phase 4:**

- Event form UI: follow `event-form.png`
- Re-sign-in once to refresh JWT if `authProviders` missing on old sessions

---

#### Design reference + theme — 2026-05-20

**Completed:**

- Moved mockups to `.cursor/design-reference/` (`dashboard.png`, `event-form.png`) — not duplicated
- `README.md` design tokens + layout spec
- Dark LuckyDraw Pro theme in `globals.css`
- Dashboard shell: sidebar, KPI cards, quick actions, empty states (matches `dashboard.png`)

**Notes for Phase 3:**

- Read `@.cursor/design-reference/README.md` before UI work
- Event form UI should follow `event-form.png` in Phase 4

---

#### Phase 2 — 2026-05-20

**Completed:**

- Full Prisma schema (tenants, users, roles, permissions, staff, plans, subscriptions, audit_logs, Auth.js tables)
- Migration `20260520114453_init_phase2`
- Auth.js v5: Credentials + Google OAuth, JWT sessions, Prisma adapter
- Login, register, forgot/reset password, protected dashboard
- Multi-tenant middleware (`x-tenant-id` header), `lib/tenant.ts`, `lib/rbac.ts`
- Seed: plans (free/pro/enterprise), super admin, demo org

**Seeded credentials:**

- Super Admin: `superadmin@luckdraw.app` / `SuperAdmin123!`
- Demo: `demo@demo.com` / `Demo1234!` (tenant: `demo-org`)

**Not done / deferred:**

- Email delivery for password reset (dev shows reset URL in API response)
- Full settings UI for OAuth account linking → Phase 3

**How to verify:**

1. `npm run docker:up && npm run db:seed`
2. Set `AUTH_SECRET` via `openssl rand -base64 32` in `.env`
3. `npm run dev` → login with demo credentials → `/dashboard`
4. For Google: add OAuth credentials + `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`

**Notes for next agent:**

- Phase 3: build sidebar layout; reuse session `tenantId` / `permissions`
- Super admin has no staff row but `isSuperAdmin` + `permissions: ["*"]`

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
Phase 4 complete — events + ticket design presets + Take photo export.
Migrations: 20260520124015_add_events_phase4, 20260520133208_phase4_ticket_designs
Add new ticket themes in prisma/seeds/ticket-designs.ts then npm run db:seed
```
