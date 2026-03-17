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
| Firebase Hosting config, routing rewrites, deploy orchestration | `haderach-platform` |
| Cloud Run deployment, secret management | Platform / ops |

## Repo layout

```
stocks/
├── src/                  # React + Vite SPA (TypeScript)
├── service/              # Cloud Run FastAPI service
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                 # Internal docs (this file)
├── tasks/                # taskmd tracking
├── .cursor/rules/        # AI conventions
├── .github/              # PR template, workflows
├── vite.config.ts        # base: /stocks/, proxy for local dev
├── firebase.json         # Local hosting emulator config
└── package.json
```

## Routing

| Path | Target | Notes |
|------|--------|-------|
| `/stocks/` | Firebase Hosting → SPA `index.html` | Client-side routing |
| `/stocks/api/**` | Firebase Hosting rewrite → Cloud Run `stocks-api` | API proxy |

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

## Security

- Default `noindex, nofollow, noarchive` on all responses
- API key never exposed to client; all Massive API calls go through the Cloud Run proxy
- Cloud Run service uses Secret Manager for `MASSIVE_API_KEY`

## Deferred

- CI/CD workflows (adapt from card app)
- Auth gate (Firebase Auth)
- Analytics (Firebase Analytics)
- E2E tests
