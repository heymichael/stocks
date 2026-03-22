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
| Shared UI components (GlobalNav, Sidebar, primitives) | `haderach-home` (`@haderach/shared-ui`) |
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
│   ├── App.tsx           # Root component (GlobalNav + Sidebar layout)
│   ├── App.css           # Shell layout and sidebar positioning
│   ├── Controls.tsx      # Date/ticker controls (embedded in Sidebar)
│   ├── PriceChart.tsx
│   ├── PriceTable.tsx
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
│   ├── rules/            # AI conventions
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md  # AI brand/token governance
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       └── publish-artifact.yml  # Build, package, upload to GCS on push to main
├── vite.config.ts        # base: /stocks/, proxy for local dev
├── firebase.json         # Local hosting emulator config
└── package.json
```

## Routing

| Path | Target | Notes |
|------|--------|-------|
| `/stocks/` | Firebase Hosting → SPA `index.html` | Client-side routing |
| `/stocks/api/**` | Firebase Hosting rewrite → Cloud Run `stocks-api` | API proxy |

## UI architecture

The SPA uses two shared components from `@haderach/shared-ui` (consumed via `file:` protocol from `../haderach-home/packages/shared-ui`):

- **GlobalNav** — cross-app top navigation bar (logo, apps dropdown, user avatar). Positioned at the top of `.app-shell`.
- **Sidebar** — collapsible left navigation panel (`collapsible="offcanvas"`). Positioned below GlobalNav using `--header-height` offset in `App.css`.

Layout hierarchy (in `App.tsx`):

```
.app-shell (flex column, full viewport)
├── GlobalNav (fixed top bar)
└── SidebarProvider (flex-1)
    ├── Sidebar (left nav)
    │   ├── Watchlist (view toggle)
    │   ├── Prices (view toggle)
    │   └── Controls (date/ticker, shown when view=prices)
    └── SidebarInset (main content)
        ├── SidebarTrigger (hamburger)
        └── PriceChart / PriceTable / Watchlist content
```

Navigation is state-driven (`view` state variable), not URL-routed. The `GlobalNav` receives accessible apps from the RBAC system via `AuthUserContext`.

### Sidebar tokens

Apps using the shared Sidebar must define `sidebar-*` tokens in `src/index.css` under `@theme`. These are Tier 2 (app-specific) tokens:

`sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`.

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

- **Sign-in:** Handled by the platform landing page at `haderach.ai/`. If no
  Firebase Auth session exists, the app redirects to `/?returnTo=/stocks/`.
- **Authorization:** Role-based access control (RBAC). User roles are stored in
  Firestore `users/{email}` documents. Access is granted if the user holds any
  role in `APP_GRANTING_ROLES['stocks']` (`admin`, `member`, `stocks_member`).
- **Unauthorized:** Access-denied screen with sign-out option.
- **Bypass:** `VITE_AUTH_BYPASS=true` or `?authBypass=1` query param skips auth (local dev).
- **Persistence:** `browserLocalPersistence` — sessions survive tab close (shared
  across all apps on `haderach.ai` via same-origin IndexedDB).
- **Fail-closed:** If Firestore is unreachable, roles resolve to empty and access is denied.

Config is read from `VITE_FIREBASE_*` env vars at build time (see `.env.example`).

## Security

- Default `noindex, nofollow, noarchive` on all responses
- API key never exposed to client; all Massive API calls go through the Cloud Run proxy
- Cloud Run service uses Secret Manager for `MASSIVE_API_KEY`
- Firebase Auth gate restricts SPA access to users with appropriate RBAC roles

## Deferred

- Analytics (Firebase Analytics)
- E2E tests
