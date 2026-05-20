# LuckyDraw Pro — Design Reference

Canonical UI reference for implementation. **Do not duplicate these files elsewhere** — link to this folder from code and planning docs.

## Screenshots

| File                                 | Screen                 | Use for                                                     |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------- |
| [`dashboard.png`](./dashboard.png)   | Main dashboard         | Sidebar, KPI cards, quick actions, empty states, dark theme |
| [`event-form.png`](./event-form.png) | Event create/edit form | Form sections, inputs, date/time, status dropdown           |

## Brand

| Token           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Product name    | **LuckyDraw Pro**                                          |
| Tagline         | Event Management                                           |
| Theme           | Dark-first (navy/charcoal + purple accent)                 |
| Primary accent  | Purple `oklch(0.58 0.24 285)`                              |
| Background      | Deep navy `oklch(0.13 0.015 285)`                          |
| Card surface    | `oklch(0.19 0.02 285)`                                     |
| Success / trend | Green `oklch(0.72 0.19 145)`                               |
| Typography      | **Plus Jakarta Sans** (UI) · **JetBrains Mono** (IDs/code) |

## Layout (dashboard)

```
┌──────────────┬────────────────────────────────────────┐
│ Sidebar      │ Header (breadcrumb + title + subtitle)│
│ - Brand      │ KPI row (4 stat cards)                │
│ - Main nav   │ Quick actions (2×2) │ Upcoming events│
│ - Tools nav  │ Recent activity (full width)          │
│ - User menu  │                                       │
└──────────────┴────────────────────────────────────────┘
```

### Sidebar navigation

**Main:** Dashboard, Events, Tickets, Prizes, Lucky Draw, Winners  
**Tools:** POS, Reports, Team, Settings

### Dashboard components

- **Stat card:** icon, label, large value, subtext, green trend badge
- **Quick action tile:** colored icon box, title, description
- **Empty state:** muted icon, heading, body, primary CTA button

## Form patterns (event-form.png)

- Section cards: title + muted description
- Full-width inputs, textarea, date/time row
- Status select at bottom

## Implementation map

| Reference area       | Code location                                                     |
| -------------------- | ----------------------------------------------------------------- |
| Theme tokens         | `app/globals.css`                                                 |
| Dashboard shell      | `components/layout/app-sidebar.tsx`, `app/(dashboard)/layout.tsx` |
| Dashboard page       | `app/(dashboard)/dashboard/page.tsx`                              |
| Event form (Phase 4) | Match `event-form.png` section card pattern                       |

## Cursor usage

```
Read @.cursor/design-reference/README.md and match dashboard.png before building UI.
```
