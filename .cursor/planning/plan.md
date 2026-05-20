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

| File                               | Purpose                                               |
| ---------------------------------- | ----------------------------------------------------- |
| [`bug_report.md`](./bug_report.md) | Track bugs, regressions, and fixes per phase          |
| [`other.md`](./other.md)           | Decisions, env notes, blockers, agent handoff context |

---

## Project goal

Build a modern **multi-tenant** Lucky Draw SaaS for organizations running raffles, lucky draws, lotteries, giveaways, and ticket-selling events.

### Out of scope (for now)

- Payment gateways (Stripe, PromptPay, LINE Pay, etc.)
- Mobile apps, AI, white-label domains, public API marketplace

### Current focus

- Core SaaS architecture
- **Authentication (email + Google OAuth)**
- Multi-tenant PostgreSQL
- Events, tickets, POS, lucky draw engine
- Dashboard and modern UI/UX
- **Custom ticket card designs** (per event) + **social-ready ticket list exports**

---

## Ticket cards, layouts & social export

> **Product requirement** spanning **Phase 4** (event settings + share UX) and **Phase 5** (ticket data + rendering).  
> Design presets will be **added often** — architecture must support new themes without migrations every time.

### Goals

| Capability                  | Description                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Per-event ticket design** | Each event selects a ticket card theme (border, background, typography, logo/badge placement).             |
| **Design catalog**          | System ships multiple presets; later: tenant-uploaded assets / custom CSS tokens.                          |
| **Flexible card views**     | Ticket list supports multiple layouts (grid cards, compact list, showcase strip, table) — user-switchable. |
| **Take photo / export**     | Org captures a high-quality image of the ticket list (or event promo card) to post on social media.        |

### Design preset fields (minimum)

- Preset `slug`, `name`, preview thumbnail
- Card: `borderStyle`, `borderColor`, `background`, `accentColor`, `fontFamily` (optional)
- Layout hints: QR position, number prominence, event branding slot

### Data model (Phase 5)

- [ ] `ticket_design_presets` — seeded catalog (extensible JSON `theme` column)
- [ ] `events.ticket_design_id` — FK, nullable → default preset
- [ ] Optional: `events.ticket_list_view_default` — enum (`grid` \| `compact` \| `showcase` \| `table`)

### UX surfaces

| Surface                                                       | Phase                                  | Notes                                                                                 |
| ------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| Event create/edit — **Ticket design** dropdown + live preview | 4 (picker UI) → 5 (applies to tickets) | Same section as ticket qty / winner count                                             |
| Event detail — **View as** card layout switcher               | 4                                      | Applies to ticket list when Phase 5 exists                                            |
| Event detail — **Take photo** button                          | 4                                      | `html-to-image` or canvas export; includes event branding; ticket grid when available |
| Tickets page — layout switcher + design preview               | 5                                      | Renders each ticket with event’s selected design                                      |
| Public event page — ticket showcase (optional)                | 5+                                     | Read-only branded cards                                                               |

### Technical notes (for agents)

- Store preset `theme` as JSON (versioned) so new designs ship via seed/migration, not code deploy only.
- **Take photo**: client-side DOM → PNG (e.g. `html-to-image`), fixed aspect ratio options (1:1, 4:5, 16:9) for Instagram/Facebook.
- Card view switcher state: URL query `?view=grid` or per-user localStorage; event default from DB.
- Screenshot target: dedicated `#ticket-share-capture` wrapper with print-safe styles (no sidebar).

---

## Global progress

| Phase | Name                           | Status            |
| ----- | ------------------------------ | ----------------- |
| 1     | Project foundation             | `[x]` Done        |
| 2     | Database & multi-tenant + auth | `[x]` Done        |
| 3     | Dashboard & layout             | `[x]` Done        |
| 4     | Event management               | `[x]` Done        |
| 5     | Ticket management              | `[x]` Done        |
| 6     | POS system                     | `[ ]` Not started |
| 7     | Lucky draw engine              | `[ ]` Not started |
| 8     | Customer management            | `[ ]` Not started |
| 9     | Analytics & reporting          | `[ ]` Not started |
| 10    | Notifications                  | `[ ]` Not started |
| 11    | Security & audit               | `[ ]` Not started |
| 12    | Subscription (no payments)     | `[ ]` Not started |
| 13    | Landing & marketing            | `[ ]` Not started |
| 14    | Performance                    | `[ ]` Not started |
| 15    | DevOps & deployment            | `[ ]` Not started |

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Cursor workflow (every phase)

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

- [ ] Google Cloud Console project + OAuth 2.0 Client (Web)
- [ ] Authorized redirect URI: `{APP_URL}/api/auth/callback/google`
- [ ] Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL`
- [ ] Sign in with Google on login + register pages
- [ ] Link Google account to existing email user (same email)
- [ ] Store `accounts` table (provider, providerAccountId, userId)
- [ ] Tenant assignment on first Google sign-in (register flow)
- [ ] Role preserved across OAuth and credentials login

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

- [x] Event form: **Ticket design** preset selector + mini preview (saved on event; applied in Phase 5)
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

**Depends on:** Phase 4 ticket design picker + share UX (see [Ticket cards, layouts & social export](#ticket-cards-layouts--social-export)).

### Checklist — database

- [x] `ticket_types`, `tickets`, `ticket_transactions`
- [x] `ticket_price_periods` (date-range pricing, no history)
- [x] `ticket_design_presets` + `events.ticket_design_id` (Phase 4)

### Checklist — pricing (no history)

- [x] Periods with `startsAt` / `endsAt` and `priceCents` (e.g. early vs late month)
- [x] Each ticket snapshots `priceCents` at generation
- [x] Active price resolved for current date when generating

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
- [x] Price schedule UI on event detail; `/dashboard/tickets`

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

- [ ] Tablet-friendly POS layout
- [ ] Sell tickets, quantity, customer assignment
- [ ] Receipt generation, draft transactions
- [ ] Offline-ready architecture notes in `other.md`
- [ ] Daily sales + staff widgets

### Exit criteria

- [ ] POS flow completes a sale and creates tickets

### Deliverable

Functional POS selling.

---

# Phase 7 — Lucky draw engine

**Cursor prompt:** `Implement Phase 7 from @.cursor/planning/plan.md`

### Checklist

- [ ] Fair random selection, duplicate prevention, multi-winner, tiers
- [ ] `draw_sessions`, history, winner logs
- [ ] Fullscreen draw UI, rolling animation, confetti
- [ ] Controls: start, pause, manual override, confirm winner

### Exit criteria

- [ ] Draw produces logged winners; no duplicate winners

### Deliverable

Complete lucky draw engine.

---

# Phase 8 — Customer management

**Cursor prompt:** `Implement Phase 8 from @.cursor/planning/plan.md`

### Checklist

- [ ] `customers`, `referrals`, `customer_notes`
- [ ] Profiles, purchase history, participation, loyalty, blacklist
- [ ] Customer dashboard + detail + timeline UI

### Exit criteria

- [ ] Customer CRUD linked to tickets/events

### Deliverable

Customer management module.

---

# Phase 9 — Analytics & reporting

**Cursor prompt:** `Implement Phase 9 from @.cursor/planning/plan.md`

### Checklist

- [ ] Revenue, ticket sales, event, staff charts
- [ ] Daily sales, event performance, draw history reports
- [ ] CSV export (Excel/PDF placeholders OK)

### Exit criteria

- [ ] Dashboard charts use real tenant data

### Deliverable

Analytics dashboard.

---

# Phase 10 — Notifications

**Cursor prompt:** `Implement Phase 10 from @.cursor/planning/plan.md`

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

# Phase 11 — Security & audit

**Cursor prompt:** `Implement Phase 11 from @.cursor/planning/plan.md`

### Checklist

- [ ] Rate limiting, RBAC middleware, input validation
- [ ] Audit trail for user, scan, winner, staff actions
- [ ] Fraud prep: duplicate ticket detection, IP logging
- [ ] OAuth session hardening (CSRF, secure cookies review)

### Exit criteria

- [ ] Sensitive routes rate-limited; audits written

### Deliverable

Hardened SaaS security layer.

---

# Phase 12 — Subscription (no payments)

**Cursor prompt:** `Implement Phase 12 from @.cursor/planning/plan.md — no payment gateway`

### Checklist

- [ ] Plan restrictions, usage tracking, feature gating, quotas
- [ ] Pricing + subscription management UI
- [ ] Enforce event/ticket/staff/analytics limits

### Exit criteria

- [ ] Limits block over-quota actions with clear UX

### Deliverable

Subscription architecture without payment integration.

---

# Phase 13 — Landing & marketing

**Cursor prompt:** `Implement Phase 13 from @.cursor/planning/plan.md`

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

# Phase 14 — Performance

**Cursor prompt:** `Implement Phase 14 from @.cursor/planning/plan.md`

### Checklist

- [ ] Frontend: lazy load, code split, images, pagination
- [ ] Backend: indexes, query optimization, caching plan
- [ ] WebSocket-ready notes in `other.md`

### Exit criteria

- [ ] Measurable improvement on key list pages

### Deliverable

Optimized platform baseline.

---

# Phase 15 — DevOps & deployment

**Cursor prompt:** `Implement Phase 15 from @.cursor/planning/plan.md`

### Checklist

- [ ] Dockerfile, docker-compose, production configs
- [ ] Vercel + managed PostgreSQL prep
- [ ] CI/CD strategy
- [ ] Production env checklist (Google OAuth production URLs)
- [ ] Error + performance monitoring stubs

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

| Date       | Change                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------- |
| 2026-05-20 | Ticket card designs (per event), card view modes, Take photo / social export — Phase 4+5     |
| 2026-05-20 | Restructured for Cursor phases; added Google OAuth; checklists; `bug_report.md` + `other.md` |
