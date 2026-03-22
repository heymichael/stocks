# Stocks

FX closing-price viewer for precious metals. Part of the [haderach](https://haderach.ai) platform.

- **Frontend:** React + Vite SPA served at `/stocks/` via Firebase Hosting. Uses `@haderach/shared-ui` for GlobalNav, Sidebar, and design tokens.
- **Backend:** FastAPI service on Cloud Run (`stocks-api`), proxies the Massive API to protect the API key

## Repo layout

```
stocks/
├── .cursor/rules/        # Cursor AI conventions
├── .github/              # PR template, workflows (deferred)
├── docs/                 # Internal docs (not served)
│   └── architecture.md
├── service/              # Cloud Run API service
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── src/                  # React SPA source
│   ├── auth/             # Platform-delegated auth gate (RBAC)
│   │   ├── accessPolicy.ts    # Role fetch and permission check
│   │   ├── AuthGate.tsx       # Redirects to platform for sign-in
│   │   ├── AuthUserContext.ts # React context for authenticated user state
│   │   └── runtimeConfig.ts
│   ├── App.tsx           # Root component (GlobalNav + Sidebar layout)
│   ├── App.css           # Shell layout and sidebar positioning
│   ├── Controls.tsx
│   ├── PriceChart.tsx
│   ├── PriceTable.tsx
│   ├── index.css         # App theme + sidebar tokens
│   ├── types.ts
│   ├── vite-env.d.ts
│   └── main.tsx
├── firebase.json         # Local dev config
├── package.json
├── vite.config.ts
└── index.html
```

## Local development

### Frontend

```bash
cp .env.example .env.local   # fill in VITE_FIREBASE_* values (or set VITE_AUTH_BYPASS=true)
npm ci
npm run dev
```

Opens at `http://localhost:5173/stocks/`. The Vite dev server proxies `/stocks/api/*` to `localhost:5001`.

Authentication is centralized at the platform level. This app redirects unauthenticated users to the platform landing page for sign-in, then checks RBAC roles from the Firestore `users/{email}` collection. With Firebase config populated and `VITE_AUTH_BYPASS=false`, the Vite dev server serves the platform landing page at `/` (via a dev-only plugin), enabling the full sign-in + RBAC flow locally.

To skip the auth gate during local development, set `VITE_AUTH_BYPASS=true` in `.env.local` or append `?authBypass=1` to the URL.

### Backend (API service)

```bash
cd service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
MASSIVE_API_KEY=<your-key> uvicorn app:app --port 5001
```

Runs on port 5001. The frontend proxy forwards API calls here during local dev.
Auto-generated API docs available at `http://localhost:5001/docs`.

### Full local stack

1. Start the backend (terminal 1): `cd service && MASSIVE_API_KEY=<key> uvicorn app:app --port 5001`
2. Start the frontend (terminal 2): `npm run dev`
3. Open `http://localhost:5173/stocks/`

## Production architecture

- SPA is built with `npm run build`, output in `dist/stocks/`
- Runtime artifact (`runtime.tar.gz`) is published to GCS and deployed via the platform
- Cloud Run service (`stocks-api`) is deployed separately; Firebase Hosting rewrites `/stocks/api/**` to it
- `MASSIVE_API_KEY` is injected via Cloud Run secret/env configuration

## API

### `GET /stocks/api/fx-range`

Proxies the Massive API for FX closing prices.

| Param    | Required | Description                                      |
|----------|----------|--------------------------------------------------|
| `ticker` | yes      | One of: `XAUUSD`, `XAGUSD`                      |
| `from`   | yes      | Start date, `YYYY-MM-DD`                         |
| `to`     | yes      | End date, `YYYY-MM-DD`                           |

**Constraints:** `from <= to`, max 31-day range.

**Response:**

```json
{
  "ticker": "XAUUSD",
  "name": "Gold",
  "massiveTicker": "C:XAUUSD",
  "from": "2025-11-01",
  "to": "2025-11-07",
  "rows": [
    { "date": "2025-11-03", "close": 2740.12 },
    { "date": "2025-11-04", "close": 2745.50 }
  ]
}
```

### `GET /stocks/api/health`

Returns `{"status": "ok"}`.
