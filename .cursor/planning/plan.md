# Lucky Draw SaaS — Cursor Phase Plan

> **How to use this file in Cursor**
>
> 1. Work **one phase at a time** — do not skip ahead.
> 2. At the start of each session, tell the agent: `Implement Phase N from @.cursor/planning/plan.md`
> 3. Check off items as you complete them (`[ ]` → `[x]`).
> 4. Log bugs in [`bug_report.md`](./bug_report.md) and notes/decisions in [`other.md`](./other.md).
> 5. Before starting the next phase, verify **Exit criteria** and **Phase gate** below.

---

## Companion files (required)

| File                                             | Purpose                                               |
| ------------------------------------------------ | ----------------------------------------------------- |
| [`bug_report.md`](./bug_report.md)               | Track bugs, regressions, and fixes per phase          |
| [`other.md`](./other.md)                         | Decisions, env notes, blockers, agent handoff context |
| [`ticket-appearance.md`](./ticket-appearance.md) | Ticket card design, layouts, social export spec       |

---

## Project goal

Build a modern **multi-tenant** Lucky Draw SaaS for organizations running **online lucky draw events** where customers buy **numbered tickets** and often choose **specific lucky numbers** (not random allocation). Ticket amounts are stored as `priceCents`; each event sets its own **ISO `currencyCode`** for display (no global USD default).

### Out of scope (for now)

- Payment gateways (Stripe, PromptPay, LINE Pay, etc.)
- Mobile apps, AI, white-label domains, public API marketplace

### Current focus

- Core SaaS architecture
- **Authentication (email + Google OAuth)** — staff + buyer intents
- Multi-tenant PostgreSQL
- Events, tickets, POS, lucky draw engine
- Dashboard and modern UI/UX
- **Buyer portal** (Home, tickets, purchases, wins, explore)
- **Custom ticket card designs** (per event) + **social-ready ticket list exports**
- **Structured logging** (`next-logger` + Pino module loggers)

---

## Ticket appearance

Product spec (card designs, list views, social export): **[`ticket-appearance.md`](./ticket-appearance.md)**.

- **Customize:** `/dashboard/events/[id]/appearance` (preset + default view; advanced tools later)
- **Dev log:** changelog below + [`other.md`](./other.md)

---

## Global progress

| Phase | Name                           | Status                     |
| ----- | ------------------------------ | -------------------------- |
| 1     | Project foundation             | `[x]` Done                 |
| 2     | Database & multi-tenant + auth | `[x]` Done                 |
| 3     | Dashboard & layout             | `[x]` Done                 |
| 4     | Event management               | `[x]` Done                 |
| 5     | Ticket management              | `[x]` Done                 |
| 6     | POS system                     | `[x]` Done                 |
| 7     | Lucky draw engine              | `[x]` Done                 |
| 8     | Customer management            | `[x]` Done                 |
| 9     | Customer account (end user)    | `[~]` Buyer portal shipped |
| 10    | Analytics & reporting          | `[ ]` Not started          |
| 11    | Notifications                  | `[ ]` Not started          |
| 12    | Security & audit               | `[ ]` Not started          |
| 13    | Subscription (no payments)     | `[ ]` Not started          |
| 14    | Landing & marketing            | `[ ]` Not started          |
| 15    | Performance                    | `[ ]` Not started          |
| 16    | DevOps & deployment            | `[ ]` Not started          |

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Logging (infrastructure)

Structured logging is wired via **`next-logger`** (patches Next.js + `console` to JSON) and **Pino module loggers** in `lib/logger/`.

| Piece                | Path / env                               | Purpose                                          |
| -------------------- | ---------------------------------------- | ------------------------------------------------ |
| Instrumentation      | `instrumentation.ts`                     | Loads `next-logger` on Node.js runtime           |
| Next.js patch config | `next-logger.config.cjs`                 | Pretty-print in dev, JSON in production          |
| App loggers          | `lib/logger/index.ts`                    | `createModuleLogger("api.events")` child loggers |
| Module names         | `lib/logger/modules.ts`                  | Canonical `LogModules` constants                 |
| Log level            | `LOG_LEVEL` env (`debug` default in dev) | Controls verbosity                               |

**Usage in server code:**

```ts
import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.events");

log.error({ err: error }, "events GET failed");
log.info({ eventId }, "event published");
```

Client components may keep `console.error` (browser-only).

---

```text
1. Read this phase section + bug_report.md + other.md
2. Implement only this phase's checklist
3. Run lint / typecheck / dev server smoke test
4. Update checklists here (mark [x])
5. Append bugs to bug_report.md
6. Append handoff notes to other.md
7. Confirm exit criteria before Phase N+1
```

### Suggested Cursor prompts

| Action      | Prompt                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Start phase | `Implement Phase {N} from @.cursor/planning/plan.md. Read @.cursor/planning/bug_report.md and @.cursor/planning/other.md first.` |
| Fix bug     | `Fix BUG-{id} from @.cursor/planning/bug_report.md`                                                                              |
| Handoff     | `Summarize Phase {N} completion into @.cursor/planning/other.md`                                                                 |
| Review      | `Review Phase {N} exit criteria in @.cursor/planning/plan.md`                                                                    |

---

## Authentication strategy (all phases)

Auth stack: **Auth.js (NextAuth v5)** with:

| Method           | Phase | Notes                                  |
| ---------------- | ----- | -------------------------------------- |
| Email + password | 2     | Credentials provider, hashed passwords |
| **Google OAuth** | **2** | Primary social login; account linking  |
| Session / JWT    | 2     | Secure cookies, RBAC after login       |
| Forgot password  | 2     | Token-based reset (email-ready)        |

### Google OAuth requirements

- [x] Google Cloud Console project + OAuth 2.0 Client (Web)
- [x] Authorized redirect URI: `{APP_URL}/api/auth/callback/google` (not `/auth/google/callback`)
- [x] Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
- [x] Sign in with Google on login + register pages (staff and buyer)
- [x] Link Google account to existing email user (same email)
- [x] Store `accounts` table (provider, providerAccountId, userId)
- [x] Tenant assignment on first Google sign-in (staff register flow)
- [x] Role preserved across OAuth and credentials login
- [x] `auth_intent` cookie splits buyer vs staff OAuth flows
- [x] Fix OAuth race: `assignGlobalUserCode` deferred to `jwt` / `createUser` (not `signIn`)

---

# Phase 1 — Project foundation

**Cursor prompt:** `Implement Phase 1 from @.cursor/planning/plan.md`

**Goal:** Running Next.js app with design system and folder structure.

### Checklist — setup

- [x] Initialize Next.js 15 App Router
- [x] Configure TypeScript (strict)
- [x] Setup Tailwind CSS
- [x] Install shadcn/ui
- [x] Setup ESLint + Prettier
- [x] Setup Husky + lint-staged
- [x] Setup environment variables (`.env.example`)
- [x] Setup Docker development environment

### Checklist — core packages

- [x] Prisma
- [x] PostgreSQL driver
- [x] Auth.js (NextAuth v5) — install only; wire in Phase 2
- [x] Zod
- [x] React Hook Form
- [x] Zustand
- [x] TanStack Query
- [x] Framer Motion
- [x] Recharts
- [x] Lucide React

### Checklist — folder structure

- [x] `/app`
- [x] `/modules`
- [x] `/components`
- [x] `/services`
- [x] `/repositories`
- [x] `/hooks`
- [x] `/store`
- [x] `/lib`
- [x] `/prisma`
- [x] `/validators`
- [x] `/types`
- [x] `/middleware`

### Checklist — design system

- [x] Button, Input, Modal, Drawer, Card, Table
- [x] Badge, Tabs, Dropdown, Toast, Skeleton

### Checklist — theme

- [x] Dark / light mode
- [x] Accent colors, typography, breakpoints

### Exit criteria

- [x] `npm run dev` starts without errors
- [x] UI primitives render on a test page
- [x] Lint passes

### Deliverable

Running Next.js project, reusable UI, base architecture.

**Phase gate:** Update global progress table → Phase 1 `[x]`.

---

# Phase 2 — Database, multi-tenant & authentication

**Cursor prompt:** `Implement Phase 2 from @.cursor/planning/plan.md — include Google OAuth`

**Goal:** PostgreSQL schema, tenant isolation, email + **Google** auth, RBAC.

### Checklist — database

- [x] Configure local PostgreSQL
- [x] Prisma migrations + client
- [x] UUID PKs, `created_at`, `updated_at`, `deleted_at`
- [x] Tenant isolation indexes

### Checklist — core tables

- [x] `tenants`
- [x] `users`
- [x] `roles`, `permissions`
- [x] `staff`
- [x] `subscriptions`, `plans`
- [x] `audit_logs`
- [x] Auth.js tables: `accounts`, `sessions`, `verification_tokens`

### Checklist — multi-tenant

- [x] `tenant_id` middleware
- [x] Tenant-aware queries
- [x] Organization isolation helpers

### Checklist — authentication (email)

- [x] Auth.js configuration (`auth.ts`, route handler)
- [x] Login page
- [x] Register page (creates user + tenant)
- [x] Forgot password flow
- [x] Session management
- [x] RBAC middleware

### Checklist — Google OAuth

- [x] Google provider in Auth.js
- [x] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env.example`
- [x] Login UI: “Continue with Google” button
- [x] Register UI: Google sign-up path
- [x] New Google user → default tenant + role assignment
- [x] Existing email user → link Google `accounts` row
- [x] Error states (denied consent, email mismatch)
- [x] Document redirect URIs in `other.md`

### Checklist — seeder

- [x] Super admin seed
- [x] Default plans
- [x] Demo tenant + demo users (credentials + optional Google test note)

### Exit criteria

- [x] Email login/register works
- [x] Google sign-in completes and lands on dashboard (when OAuth env configured)
- [x] Queries scoped by `tenant_id`
- [x] Migrations apply cleanly

### Deliverable

Working auth (email + Google), multi-tenant Prisma schema.

**Phase gate:** Log Google OAuth redirect URLs in `other.md`. Phase 2 `[x]`.

---

# Phase 3 — Dashboard & layout

**Cursor prompt:** `Implement Phase 3 from @.cursor/planning/plan.md`

**Design reference (required):** [`.cursor/design-reference/README.md`](../design-reference/README.md) · `dashboard.png` · `event-form.png`

**Goal:** Premium SaaS admin shell (protected routes). Extend the Phase 2.5 dashboard shell already aligned to reference.

### Checklist — layout

- [x] Sidebar, top navbar (shell — see design-reference)
- [x] Workspace / tenant switcher
- [x] Notification dropdown (UI shell)
- [x] User profile dropdown (show provider: Google vs email)
- [x] Breadcrumbs

### Checklist — dashboard

- [x] KPI cards (placeholder data)
- [x] Chart placeholders (Recharts)
- [x] Ticket sales widgets
- [x] Activity feed (real audit logs + empty state)
- [x] Event status cards
- [x] Skeleton loading + empty states (upcoming events)

### Checklist — polish

- [x] Framer Motion transitions
- [x] Responsive breakpoints
- [x] Auth guard on all `/dashboard` routes

### Exit criteria

- [x] Logged-in user sees dashboard
- [x] Google and email users see same layout
- [x] Mobile layout usable

### Deliverable

Premium SaaS dashboard UI.

---

# Phase 4 — Event management

**Cursor prompt:** `Implement Phase 4 from @.cursor/planning/plan.md`

### Checklist — CRUD

- [x] Create, edit, delete, publish, archive events
- [x] Fields: name, description, banner, rules, dates, draw schedule, ticket qty, winner count

### Checklist — UI

- [x] Event cards, table, calendar view
- [x] Event detail page (admin)
- [x] Public landing + event detail (ticket UI placeholder)

### Checklist — ticket design & share (Phase 4 prep → Phase 5)

> Core ticket rendering is Phase 5; event phase wires **settings + export UX** first.

- [x] **Ticket appearance** page: preset selector + default list view (`/dashboard/events/[id]/appearance`)
- [x] Event detail: **Card view** switcher placeholder (`grid` \| `compact` \| `showcase` \| `table`) for ticket list
- [x] Event detail / tickets tab: **Take photo** — export shareable PNG (event promo; ticket grid when Phase 5 live)
- [x] Aspect ratio options for export (1:1, 4:5, 16:9)
- [x] Document preset catalog location: `prisma/seeds/ticket-designs.ts` (or JSON in `/public/ticket-designs/`)

### Exit criteria

- [x] Full event lifecycle tenant-scoped
- [x] Public page renders without auth
- [x] Event saves `ticket_design_id` (or preset slug) and default list view preference
- [x] **Take photo** produces downloadable PNG from event detail (smoke test)

### Deliverable

Working event management + hooks for branded tickets and social sharing.

---

# Phase 5 — Ticket management

**Cursor prompt:** `Implement Phase 5 from @.cursor/planning/plan.md`

**Depends on:** Phase 4 ticket appearance + share UX (see [`ticket-appearance.md`](./ticket-appearance.md)).

### Checklist — database

- [x] `ticket_types`, `tickets`, `ticket_transactions`
- [x] `ticket_price_periods` (date-range pricing, no history)
- [x] `ticket_design_presets` + `events.ticket_design_id` (Phase 4)

### Checklist — pricing (no history)

- [x] Periods with `startsAt` / `endsAt` and `priceCents` (e.g. early vs late month)
- [x] Each ticket snapshots `priceCents` at generation
- [x] Active price resolved for current date when generating
- [x] Per-event `currencyCode` (ISO 4217) on `events`; `formatMoney(cents, event.currencyCode)` — no USD default

### Checklist — design catalog

- [x] Seed presets in `prisma/seeds/ticket-designs.ts`
- [x] `GET /api/ticket-designs`
- [x] Branded cards from event `ticket_design_id`

### Checklist — features

- [x] Auto numbering, bulk generation (capacity = `event.ticketQuantity`)
- [x] QR codes (`qrToken` + `qrcode`)
- [x] Status tracking AVAILABLE → SOLD → VALIDATED
- [x] Branded card rendering from preset `theme`

### Checklist — UI & validation

- [x] Ticket cards + grid / compact / showcase / table views
- [x] QR modal; validate API; duplicate scan blocked
- [x] Take photo export on event tickets
- [x] Price schedule UI on event detail; `/dashboard/tickets` (summary, price groups, status counts, View/Modify actions)

### Checklist — card view options (reference)

| View       | Use case                                           |
| ---------- | -------------------------------------------------- |
| `grid`     | Default; large branded cards, good for screenshots |
| `compact`  | Dense list; many ticket numbers visible            |
| `showcase` | Hero strip — top N tickets for promo posts         |
| `table`    | Ops/admin sort, filter, export                     |

### Exit criteria

- [x] Generate, view, validate tickets end-to-end
- [x] Tickets can have different prices via periods; no price history table
- [x] Take photo + design presets (Phase 4)

### Deliverable

Functional ticket system with **selectable branded card designs**, **flexible list layouts**, and **social-ready image export**.

---

# Phase 6 — POS system

**Cursor prompt:** `Implement Phase 6 from @.cursor/planning/plan.md`

### Checklist

- [x] Tablet-friendly POS layout
- [x] Pick specific ticket numbers (lucky numbers) + customer info (name, phone required)
- [x] Ticket number search/grid picker; draft lines store selected numbers
- [x] Receipt generation, draft transactions
- [x] Offline-ready architecture notes in `other.md`
- [x] Daily sales + staff widgets
- [x] **`/dashboard/sales`** — tenant-scoped sale list page (completed POS sales only)
- [x] **`listTenantPosSales`** in `services/pos.service.ts` — paginated query on `pos_sales` where `status = COMPLETED`, ordered by `completedAt desc`
- [x] **`GET /api/pos/sales/history`** — query params: `eventId`, `from`, `to`, `q` (receipt # / customer name / phone), `limit`, `offset`
- [x] **Summary strip** — sale count, ticket count, revenue for current filter
- [x] **Sales table** — columns: receipt #, date/time, event, customer, ticket count, total, staff; row action **View receipt**
- [x] **Receipt detail** — reuse `PosReceiptDialog` fed by `getPosSaleById`
- [x] **Filters** — date preset (today / 7 days / all), custom date range (from/to), event dropdown, search box
- [x] **Sidebar nav** — add **Sales** item in `app-sidebar.tsx` (between POS and Reports)
- [x] **POS cross-link** — "View all sales →" on `pos-client.tsx` pointing to `/dashboard/sales`

> **Scope note:** Draft and cancelled sales stay on POS; Phase 10 reports will add charts/CSV export — this page is the **operational transaction list**, not analytics.

### Exit criteria

- [x] Staff completes a sale with customer-chosen ticket numbers; tickets move to SOLD
- [x] Staff can browse completed sales, filter by event/date, and reopen a receipt

### Deliverable

Functional POS selling numbered tickets by explicit selection **plus a completed-sales ledger at `/dashboard/sales`**. Public online checkout will reuse the same pick-numbers model in a later phase.

---

# Phase 7 — Lucky draw engine

**Cursor prompt:** `Implement Phase 7 from @.cursor/planning/plan.md`

### Checklist

- [x] Fair random selection, duplicate prevention, multi-winner, tiers
- [x] `draw_sessions`, history, winner logs
- [x] Fullscreen draw UI, rolling animation, confetti
- [x] Controls: start, pause, manual override, confirm winner

### Exit criteria

- [x] Draw produces logged winners; no duplicate winners

### Deliverable

Complete lucky draw engine.

---

# Phase 8 — Customer management

**Cursor prompt:** `Implement Phase 8 from @.cursor/planning/plan.md`

### Checklist

- [x] `customers`, `referrals`, `customer_notes`
- [x] Profiles, purchase history, participation, loyalty, blacklist
- [x] Customer dashboard + detail + timeline UI

### Exit criteria

- [x] Customer CRUD linked to tickets/events

### Deliverable

Customer management module (tenant CRM). Base CRM shipped; see **Phase 8 extension** below for global user codes and organizer linking.

### Phase 8 extension — Global user code & organizer linking

**Status:** `[x]` Done

**Cursor prompt:** `Implement Phase 8 extension (global user code & organizer linking) from @.cursor/planning/plan.md`

#### Identity model

```text
User (global)                    ← email + globalUserCode e.g. LD-A7K2M9
  └── Customer (tenant A)        ← CRM profile at Organizer A (userId FK)
  └── Customer (tenant B)        ← CRM profile at Organizer B (userId FK)
```

| Field            | Model      | Notes                                                                                                              |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `globalUserCode` | `User`     | Auto-generated, globally unique, short alphanumeric (e.g. `LD-A7K2M9`). Assigned on user create (register, OAuth). |
| `userId`         | `Customer` | FK to `User`. Set when organizer links or creates with a global account.                                           |

Not the same as `Customer.referralCode` (per-tenant referral tracking).

#### Code generation rules

- Format: `{PREFIX}-{6-char alphanumeric}` e.g. `LD-A7K2M9`
- Charset: uppercase A–Z + digits 2–9 (exclude ambiguous 0/O, 1/I/L)
- Retry on collision (extremely unlikely)

#### Schema

- [x] Add `User.globalUserCode` (`global_user_code`) — unique, indexed, auto-generated on create
- [x] Backfill existing users with codes via migration/script (`backfillGlobalUserCodes`)
- [x] Expose `globalUserCode` in user DTOs used by search APIs (never expose raw UUID to organizers for lookup)

#### Organizer Customer CRUD — create

- [x] **Global account search** on create form: type `globalUserCode` **or** email
- [x] `GET /api/customers/lookup-global?q=` — returns matching global users (code exact, email partial); requires `customers.write`
- [x] If account found → select → pre-fill name/email/phone from `User` + any known profile hints → create `Customer` with `userId` set
- [x] If not found → create orphan `Customer` (phone required, `userId` null) as today

#### Organizer Customer CRUD — link existing

- [x] On customer detail/edit: **Link global account** action for customers where `userId` is null
- [x] Same search/select UI (code or email)
- [x] `POST /api/customers/[id]/link-user` — set `Customer.userId`; reject if user already linked at this tenant or customer already linked
- [x] Show linked `globalUserCode` + email on customer profile when linked

#### POS integration (extend existing)

- [x] Customer search in POS may optionally search by `globalUserCode` in addition to name/phone
- [x] Selecting a linked customer shows global code in summary card

#### Exit criteria (extension)

- [x] Every `User` has a unique `globalUserCode`
- [x] Organizer can create a customer pre-linked by searching code/email
- [x] Organizer can link an orphan customer to a global account retroactively
- [x] Linked customer shows global code in CRM detail and POS picker

#### Deliverable (extension)

Organizer-facing global account lookup + link, with auto-generated buyer IDs.

---

# Phase 9 — Customer account (end user)

**Cursor prompt:** `Implement Phase 9 from @.cursor/planning/plan.md`

**Goal:** Let **ticket buyers** create a global user account and see their tickets, purchases, and wins — even when they have bought from **many different event organizers** (tenants).

### Identity model

```text
User (global)                    ← email + globalUserCode e.g. LD-A7K2M9
  └── Customer (tenant A)        ← CRM profile at Organizer A
  └── Customer (tenant B)        ← CRM profile at Organizer B
  └── Staff (tenant A)           ← optional; same person can be staff AND customer
```

- **Phase 8** created tenant-scoped `Customer` rows (phone dedup per tenant).
- **Phase 8 extension** lets organizers link customers to global accounts via `globalUserCode` or email in CRM/POS.
- **Phase 9** adds buyer self-service: login, claim by verification, and cross-organizer portal.
- A buyer may appear as **multiple `Customer` records** (one per organizer); the portal aggregates them under one account.
- Staff dashboard auth (`Staff` + RBAC) stays separate from the buyer portal.

### Checklist — auth & linking

- [x] Buyer registration + login (email/password + Google OAuth; reuse Auth.js `User` table; assign `globalUserCode` on create)
- [x] Dedicated routes: `/account` (portal), `/account/login`, `/account/register` (route group `(account)`)
- [x] **Buyer-initiated claim / link** flow: verify phone (SMS stub OK) or email to attach orphan `Customer` rows where `userId` is null
- [x] On POS sale complete: if phone matches a logged-in buyer `User`, set `Customer.userId` automatically (`claimCustomersByEmail`)
- [x] On buyer sign-up / Google sign-in: claim orphan `Customer` rows by verified phone/email
- [x] Prevent linking a `Customer` already owned by another `User`
- [ ] Buyer profile displays `globalUserCode` on a dedicated profile card (removed from home; show in settings/profile later)

### Checklist — buyer portal UI

- [x] **Home** (`/account`) — featured events, quick links, recent win highlight (user info card removed per design)
- [x] **Explore** (`/account/explore`) — published events across organizers with search
- [x] **My tickets** — all tickets across organizers (event name, org name, ticket number, status)
- [x] **My purchases** — POS receipts grouped by organizer
- [x] **My wins** — draw results with prize name, event, organizer
- [ ] Per-organizer filter or tabs when buyer has history at multiple tenants
- [x] Mobile-responsive layout (buyers mostly on phone)

### Checklist — API

- [x] `GET /api/me` — buyer profile + linked customer profile IDs
- [x] `GET /api/me/tickets`, `/api/me/purchases`, `/api/me/wins` — cross-tenant aggregation (scoped to `userId`)
- [x] `GET /api/me/events/featured`, `/api/me/events/explore` — buyer home + explore
- [x] `POST /api/me/link-phone` (or email) — verify and link orphan `Customer` rows
- [x] `POST /api/auth/buyer/register` — buyer self-registration
- [x] Middleware: buyer routes require session; staff vs buyer intent via `auth_intent` cookie on OAuth

### Exit criteria

- [ ] Buyer registers once and sees tickets/wins from **two or more organizers** after linking (needs multi-tenant smoke test)
- [x] New POS purchase auto-links to logged-in buyer when phone matches
- [x] Staff dashboard and buyer portal do not conflict for users who are both

### Deliverable

End-user customer account portal with multi-organizer ticket & winner history.

---

# Phase 10 — Analytics & reporting

**Cursor prompt:** `Implement Phase 10 from @.cursor/planning/plan.md`

### Checklist

- [ ] Revenue, ticket sales, event, staff charts
- [ ] Daily sales, event performance, draw history reports
- [ ] CSV export (Excel/PDF placeholders OK)

### Exit criteria

- [ ] Dashboard charts use real tenant data

### Deliverable

Analytics dashboard.

---

# Phase 11 — Notifications

**Cursor prompt:** `Implement Phase 11 from @.cursor/planning/plan.md`

### Checklist

- [ ] `notifications`, `notification_templates`
- [ ] In-app notification center
- [ ] Triggers: purchase, winner, reminder, draw complete
- [ ] Email / LINE / SMS architecture stubs in `other.md`

### Exit criteria

- [ ] In-app notifications fire on defined triggers

### Deliverable

Internal notification system.

---

# Phase 12 — Security & audit

**Cursor prompt:** `Implement Phase 12 from @.cursor/planning/plan.md`

### Checklist

- [ ] Rate limiting, RBAC middleware, input validation
- [ ] Audit trail for user, scan, winner, staff actions
- [ ] Fraud prep: duplicate ticket detection, IP logging
- [ ] OAuth session hardening (CSRF, secure cookies review)
- [x] **Structured logging** — `next-logger` (Next.js + console patch) + Pino module loggers in `lib/logger/`

### Exit criteria

- [ ] Sensitive routes rate-limited; audits written

### Deliverable

Hardened SaaS security layer.

---

# Phase 13 — Subscription (no payments)

**Cursor prompt:** `Implement Phase 13 from @.cursor/planning/plan.md — no payment gateway`

### Checklist

- [ ] Plan restrictions, usage tracking, feature gating, quotas
- [ ] Pricing + subscription management UI
- [ ] Enforce event/ticket/staff/analytics limits

### Exit criteria

- [ ] Limits block over-quota actions with clear UX

### Deliverable

Subscription architecture without payment integration.

---

# Phase 14 — Landing & marketing

**Cursor prompt:** `Implement Phase 14 from @.cursor/planning/plan.md`

### Checklist

- [ ] Homepage, features, pricing, FAQ, contact
- [ ] Premium SaaS design + animations
- [ ] SEO: metadata, OpenGraph, sitemap, structured data
- [ ] Marketing CTAs: Sign up / **Continue with Google**

### Exit criteria

- [ ] Public site deployable; auth CTAs link to Phase 2 routes

### Deliverable

Marketing website.

---

# Phase 15 — Performance

**Cursor prompt:** `Implement Phase 15 from @.cursor/planning/plan.md`

### Checklist

- [ ] Frontend: lazy load, code split, images, pagination
- [ ] Backend: indexes, query optimization, caching plan
- [ ] WebSocket-ready notes in `other.md`

### Exit criteria

- [ ] Measurable improvement on key list pages

### Deliverable

Optimized platform baseline.

---

# Phase 16 — DevOps & deployment

**Cursor prompt:** `Implement Phase 16 from @.cursor/planning/plan.md`

### Checklist

- [ ] Dockerfile, docker-compose, production configs
- [ ] Vercel + managed PostgreSQL prep
- [ ] CI/CD strategy
- [ ] Production env checklist (Google OAuth production URLs)
- [x] Error + performance monitoring stubs — structured JSON logging via `next-logger` + `LOG_LEVEL`

### Exit criteria

- [ ] Deploy docs in `other.md`; staging build succeeds

### Deliverable

Deployable SaaS platform.

---

## Future phases (do not implement)

- Payment gateways (Stripe, PromptPay, LINE Pay)
- Mobile apps, AI, white-label, API marketplace, affiliate

---

## Product vision

The platform should feel like:

- Stripe-quality SaaS
- Linear-level UI polish
- Enterprise raffle management
- Investor-demo ready

Requirements: beautiful, fast, scalable, mobile-responsive, multi-tenant, production-ready.

---

## Changelog (plan updates)

| Date       | Change                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-08-02 | Structured logging: `next-logger` + Pino module loggers (`lib/logger/`); `LOG_LEVEL` env var                  |
| 2026-08-02 | Phase 8 extension done; Phase 9 buyer portal shipped (home, explore, tickets, purchases, wins, OAuth)         |
| 2026-08-01 | Phase 8 extension: `User.globalUserCode` (LD-XXXXXX), organizer search/link by code or email in Customer CRUD |
| 2026-08-01 | Phase 8 done; new Phase 9 Customer account (multi-organizer buyer portal); phases 9–15 → 10–16                |
| 2026-05-20 | Ticket appearance spec → `ticket-appearance.md`; dedicated appearance page                                    |
| 2026-05-20 | Ticket card designs (per event), card view modes, Take photo / social export — Phase 4+5                      |
| 2026-05-20 | Restructured for Cursor phases; added Google OAuth; checklists; `bug_report.md` + `other.md`                  |
