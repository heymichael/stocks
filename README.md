# Stocks

FX closing-price viewer for precious metals. Part of the [haderach](https://haderach.ai) platform.

- **Frontend:** React + Vite SPA served at `/stocks/` via Firebase Hosting
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
│   ├── App.tsx
│   ├── Controls.tsx
│   ├── PriceChart.tsx
│   ├── PriceTable.tsx
│   ├── types.ts
│   └── main.tsx
├── tasks/                # taskmd task tracking
├── firebase.json         # Local dev config
├── package.json
├── vite.config.ts
└── index.html
```

## Local development

### Frontend

```bash
npm ci
npm run dev
```

Opens at `http://localhost:5173/stocks/`. The Vite dev server proxies `/stocks/api/*` to `localhost:5001`.

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
