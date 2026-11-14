# ChessDesk

A premium, responsive coaching-management workspace for a personal chess coaching business. This repository currently contains **Phase 1 only**: the application foundation, navigation shell, and dashboard UI.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Install and run locally

```bash
npm install
npm run dev
```

The Vite server binds to `0.0.0.0`. Open the local URL printed by Vite, normally `http://localhost:5173`.

## Build for production

```bash
npm run build
```

The optimized production site is generated in `dist/`. To verify that build locally:

```bash
npm run preview
```

## Deploy to Render

Create a **Static Site** from the GitHub repository and use:

- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`

Add a rewrite rule with source `/*` and destination `/index.html` so React Router routes such as `/dashboard` and `/students` work when opened directly.

## Quality checks

```bash
npm run lint
npm run build
```

## Technology

- React 19 + TypeScript (strict mode)
- Vite
- Tailwind CSS 4
- React Router
- Lucide icons

No backend, database, paid API, authentication provider, or PWA service worker is included in this phase.

## Project structure

```text
src/
├── app/
│   └── App.tsx                    # Route registration
├── components/
│   ├── layout/                    # Responsive shell, sidebar, and branding
│   └── ui/                        # Reusable cards, badges, stats, avatars, progress
├── config/
│   └── navigation.ts              # Single source of truth for routes and navigation
├── data/
│   └── dashboard.ts               # Isolated UI demonstration data
├── features/
│   ├── dashboard/                 # Dashboard page and feature components
│   └── shared/                    # Shared future-phase placeholder page
├── types/
│   └── dashboard.ts               # Typed dashboard data contracts
├── index.css                      # Tailwind theme, colors, and global styles
└── main.tsx                       # Application entry point
```

## Implemented in Phase 1

- Fully responsive desktop sidebar and mobile navigation drawer
- All ten requested destinations with active navigation states
- Dashboard summary cards for students, institutions, classes, attendance, improvement needs, and upcoming classes
- Upcoming class schedule and recent activity
- Responsive student overview with attendance, learning progress, focus areas, and standing
- Accessible labels, progress semantics, keyboard focus states, skip link, and reduced-motion support
- Clean placeholders for sections reserved for later phases

## Future integration points

The dashboard components depend on typed data rather than a backend implementation. Replace the exports in `src/data/dashboard.ts` with API-backed query results when the backend phase begins. Domain types can then move into shared client/server contracts as needed.

For PWA support, add a web app manifest, icons, service-worker caching strategy, and offline behavior only after the data and authentication requirements are defined.

## Recommended next phase

Build the **Students and Institutions** workflows first, including their domain models and CRUD API boundaries. Those records provide the foundation for batches, attendance, concept tracking, performance analysis, and reports.
