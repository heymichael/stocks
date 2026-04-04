# Stocks — Architecture

## Overview

Two-component app: a static React SPA served via Firebase Hosting and a FastAPI service running on Cloud Run.

```
Browser
  │
  ├── GET /stocks/*  ──────►  Firebase Hosting (static SPA)
  │
  └── GET /stocks/api/*  ──►  Firebase Hosting rewrite
                                   │
                                   ▼
                              Cloud Run (stocks-api, FastAPI)
                                   │
                                   ▼
                              Massive API (api.massive.com)
```

## Ownership boundaries

| Concern | Owner |
|---------|-------|
| SPA frontend, CI, artifact publish | This repo (`stocks`) |
| Cloud Run service code (FastAPI) + Dockerfile | This repo (`stocks/service/`) |
| Shared UI components (AppRail, PaneLayout, ChatPanel, DataTable, primitives) | `haderach-home` (`@haderach/shared-ui`) |
| Firebase Hosting config, routing rewrites, deploy orchestration | `haderach-platform` |
| Cloud Run deployment, secret management | Platform / ops |

## Repo layout

```
stocks/
├── src/                  # React + Vite SPA (TypeScript)
│   ├── auth/             # Firebase Auth gate (platform-delegated sign-in)
│   │   ├── accessPolicy.ts    # RBAC role fetch and permission check
│   │   ├── AuthGate.tsx       # Auth gate component (redirects to platform for sign-in)
│   │   ├── AuthUserContext.ts # React context for authenticated user state
│   │   └── runtimeConfig.ts   # Firebase config from VITE_* env vars
│   ├── App.tsx           # Root component (AppRail + PaneToolbar + PaneLayout)
│   ├── App.css           # Shell layout
│   ├── PriceToolbar.tsx  # Ticker/date controls and view mode toggle
│   ├── PriceDataView.tsx # Tabbed container (Chart | Table toggle)
│   ├── PriceChart.tsx    # Recharts line chart (ResizeObserver-based sizing)
│   ├── PriceTable.tsx    # Thin wrapper passing columns + data to shared DataTable
│   ├── price-columns.tsx # Column definitions (ColumnDef) for the price table
│   ├── index.css         # App theme tokens + sidebar tokens
│   ├── main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
├── service/              # Cloud Run FastAPI service
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── scripts/              # Build and publish scripts
│   ├── package-artifacts.sh   # Tar dist/ + checksums
│   └── generate-manifest.mjs # Produce manifest.json for platform contract
├── docs/                 # Internal docs (this file)
├── .cursor/
│   ├── rules/
│   │   ├── architecture-pointer.mdc
│   │   ├── branch-safety-reminder.mdc
│   │   ├── cross-repo-status.mdc
│   │   ├── dev-data-mocking.mdc
│   │   ├── pr-conventions.mdc
│   │   ├── repo-hygiene.mdc
│   │   ├── service-oriented-data-access.mdc
│   │   └── todo-conventions.mdc
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml                   # PR checks (lint + build)
│       └── publish-artifact.yml     # Build, package, upload to GCS on push to main
├── .env.example
├── .firebaserc
├── .gitignore
├── eslint.config.js
├── firebase.json         # Hosting config (headers, rewrites, emulator)
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts        # base: /stocks/, proxy for local dev
└── README.md
```

## Routing

| Path | Target | Notes |
|------|--------|-------|
| `/stocks/` | Firebase Hosting → SPA `index.html` | Client-side routing |
| `/stocks/api/**` | Firebase Hosting rewrite → Cloud Run `stocks-api` | API proxy |

## UI architecture

The SPA uses the domain shell layout from `@haderach/shared-ui` (consumed via `file:` protocol from `../haderach-home/packages/shared-ui`):

- **AppRail** — collapsible left rail for domain navigation with feedback popover and user avatar flyout.
- **PaneToolbar** — horizontal toolbar toggling chat, analytics, and data panes.
- **PaneLayout** — resizable three-pane area (chat | analytics | data) using `react-resizable-panels`.
- **ChatPanel** — embedded chat pane (`mode="panel"`) connected to the agent service.
- **DataTable** — generic sortable data table with optional CSV download (TanStack Table + Table primitives). `PriceTable` passes column defs and data; all wiring is in shared-ui.
- **Table / Tabs** — shadcn primitives used by the data display components.

Layout hierarchy (in `App.tsx`):

```
.flex.h-screen
├── AppRail (left rail)
└── .flex-1 (flex column)
    ├── PaneToolbar (chat | analytics | data toggles)
    └── PaneLayout
        ├── ChatPanel (chat pane)
        ├── Analytics pane
        │   ├── PriceToolbar (ticker, date range, view mode, download)
        │   └── PriceDataView (Chart | Table toggle)
        │       ├── PriceChart (Recharts line chart)
        │       └── PriceTable (TanStack DataTable, sortable, CSV download)
        └── Data pane (reserved)
```

The app defaults to chat-only view on load. The analytics pane holds the price toolbar, chart, and table.

### Data display stack

- **Charting:** Recharts `LineChart` with custom `ResizeObserver`-based container sizing and inline tooltip (replaced Chart.js; does not use shadcn `ChartContainer`)
- **Tables:** `DataTable` from `@haderach/shared-ui` (TanStack Table + shadcn primitives). This app provides column definitions and data only; sorting and CSV download are handled by the shared component.

Navigation is state-driven, not URL-routed.

## Build and deploy flow

### SPA (frontend)

1. `npm run build` → `dist/stocks/` (Vite output)
2. Package as `runtime.tar.gz`
3. Upload to `gs://<bucket>/stocks/versions/<commit-sha>/`
4. Platform downloads, verifies, extracts into `hosting/public/stocks/`
5. `firebase deploy --only hosting`

### API service (Cloud Run)

1. Build Docker image from `service/Dockerfile`
2. Push to Artifact Registry
3. Deploy to Cloud Run as `stocks-api` in `us-central1`
4. `MASSIVE_API_KEY` injected via Secret Manager

## Local development

The Vite dev server proxies `/stocks/api/*` to `localhost:5001` where the FastAPI service runs via uvicorn. This mirrors the production routing topology without needing Firebase Hosting rewrites locally.

## Authentication (Phase 2 — Platform Auth + RBAC)

Authentication is centralized at the platform level. This app does not handle
sign-in directly.

- **Sign-in (production):** Handled by the platform landing page at `haderach.ai/`.
  If no Firebase Auth session exists, the app redirects to `/?returnTo=/stocks/`.
- **Sign-in (local dev):** When `import.meta.env.DEV` is true and no session exists,
  the app shows a dev-only "Sign in with Google" button instead of redirecting,
  allowing authentication directly on the app's origin.
- **Authorization:** Role-based access control (RBAC). User roles are stored in
  Postgres (managed by the agent service) and resolved at runtime via
  `fetchUserDoc` (from `@haderach/shared-ui`), which calls `GET /agent/api/me`.
  Access is granted if the user holds any role in `APP_GRANTING_ROLES['stocks']`.
- Auth primitives (`BaseAuthUser`, `fetchUserDoc`, `buildDisplayName`) and RBAC
  helpers (`APP_CATALOG`, `APP_GRANTING_ROLES`, `hasAppAccess`, `getAccessibleApps`)
  are imported from `@haderach/shared-ui` — this app does not maintain local copies.
  `AuthUser` re-exports `BaseAuthUser` directly (no app-specific extensions).
- **Unauthorized:** Access-denied screen with sign-out option.
- **Bypass:** `VITE_AUTH_BYPASS=true` or `?authBypass=1` query param skips auth (local dev).
- **Persistence:** `browserLocalPersistence` — sessions survive tab close (shared
  across all apps on `haderach.ai` via same-origin IndexedDB).
- **Fail-closed:** If the agent API is unreachable, roles resolve to empty and access is denied.

Config is read from `VITE_FIREBASE_*` env vars at build time (see `.env.example`).

## Security

- Default `noindex, nofollow, noarchive` on SPA and Firebase Hosting responses
- API key never exposed to client; all Massive API calls go through the Cloud Run proxy
- Cloud Run service uses Secret Manager for `MASSIVE_API_KEY`
- Firebase Auth gate restricts SPA access to users with appropriate RBAC roles

## Deferred

- Analytics (Firebase Analytics)
- E2E tests
