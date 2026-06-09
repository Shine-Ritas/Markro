# Ticket appearance & card design

> **Product spec** for branded ticket cards, list layouts, and social export.  
> **Dev log / phase tracking** stays in [`plan.md`](./plan.md) and [`other.md`](./other.md).

---

## Goals

| Capability                  | Description                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **Per-event ticket design** | Each event selects a ticket card theme (border, background, typography, logo/badge placement). |
| **Design catalog**          | System ships multiple presets; later: tenant-uploaded assets / custom CSS tokens.              |
| **Flexible card views**     | Ticket list supports multiple layouts (grid, compact, showcase, table) — user-switchable.      |
| **Take photo / export**     | Org captures a high-quality image of the ticket list (or event promo card) for social media.   |

### Out of scope (for now)

- Visual editor / drag-and-drop layout tools
- Per-field color pickers, custom fonts upload
- Tenant-owned preset CRUD in UI

> **Later:** Advanced customization tools on the same **Ticket appearance** page (layered on preset + tokens).

---

## Design preset fields (minimum)

- Preset `slug`, `name`, preview thumbnail
- Card: `borderStyle`, `borderColor`, `background`, `accentColor`, `fontFamily` (optional)
- Layout hints: QR position, number prominence, event branding slot

---

## Data model

| Table / column                    | Status | Notes                                        |
| --------------------------------- | ------ | -------------------------------------------- |
| `ticket_design_presets`           | Done   | JSON `theme` column, seeded catalog          |
| `events.ticket_design_id`         | Done   | FK, nullable → default preset                |
| `events.ticket_list_view_default` | Done   | `GRID` \| `COMPACT` \| `SHOWCASE` \| `TABLE` |

Seed location: `prisma/seeds/ticket-designs.ts`

---

## UX surfaces

| Surface                              | Status | Route / location                                                                                                  |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| **Ticket appearance** (dedicated)    | Done   | `/dashboard/events/[id]/appearance` — preset + default view                                                       |
| Event create/edit (core fields only) | Done   | Design defaults on create; customize on appearance page                                                           |
| Event detail — tickets + share       | Done   | View switcher, **Take photo**, branded cards                                                                      |
| Tickets dashboard                    | Done   | `/dashboard/tickets` — aggregated table: Event, Ticket type, Total tickets, Price, Status (badge + count), Action |
| Public event page (optional)         | Later  | Read-only branded cards                                                                                           |

---

## Card view modes

| View       | Use case                                           |
| ---------- | -------------------------------------------------- |
| `grid`     | Default; large branded cards, good for screenshots |
| `compact`  | Dense list; many ticket numbers visible            |
| `showcase` | Hero strip — top N tickets for promo posts         |
| `table`    | Ops/admin sort, filter, export                     |

- Runtime switcher: URL `?view=grid` or localStorage
- Event default: `events.ticket_list_view_default`

---

## Technical notes

- Preset `theme` is versioned JSON — new designs via seed, not only code deploy.
- **Take photo**: full-width share preview (`#event-share-capture`); screenshot to share; aspect ratios 1:1, 4:5, 16:9 adjust grid layout.
- API: `GET /api/ticket-designs`, `PATCH /api/events/[id]/appearance`.
- Screenshot wrapper: print-safe styles, no sidebar.

---

## Roadmap (appearance page)

| Milestone               | Notes                                                |
| ----------------------- | ---------------------------------------------------- |
| Preset picker + preview | Current                                              |
| Default list view       | Current                                              |
| Advanced design tools   | Custom colors, borders, logo slot, live card builder |
| Tenant custom presets   | Upload assets, save as org catalog                   |

---

## Changelog (spec)

| Date       | Change                                                         |
| ---------- | -------------------------------------------------------------- |
| 2026-05-20 | Initial spec (split from `plan.md`)                            |
| 2026-05-20 | Dedicated **Ticket appearance** page; event form = core fields |
