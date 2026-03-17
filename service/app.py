import os
import re
from datetime import date as dt_date, datetime, timezone

import httpx
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse

app = FastAPI()

MASSIVE_BASE_URL = "https://api.massive.com/v2/aggs/ticker"
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TICKER_NAMES = {
    "XAUUSD": "Gold",
    "XAGUSD": "Silver",
}
ALLOWED_TICKERS = set(TICKER_NAMES)
MAX_RANGE_DAYS = 31


@app.get("/stocks/api/health")
async def health():
    return {"status": "ok"}


@app.get("/stocks/api/fx-range")
async def fx_range(
    ticker: str = "",
    date_from: str = Query("", alias="from"),
    date_to: str = Query("", alias="to"),
):
    api_key = os.environ.get("MASSIVE_API_KEY")
    if not api_key:
        return JSONResponse(
            {"error": "Server misconfiguration",
             "details": "MASSIVE_API_KEY is not set."},
            status_code=500,
        )

    ticker = ticker.strip().upper()
    if ticker not in ALLOWED_TICKERS:
        return JSONResponse(
            {"error": "Invalid ticker",
             "details": f"ticker must be one of: {', '.join(sorted(ALLOWED_TICKERS))}"},
            status_code=400,
        )

    date_from = date_from.strip()
    date_to = date_to.strip()

    if not date_from or not DATE_PATTERN.match(date_from):
        return JSONResponse(
            {"error": "Invalid 'from' date",
             "details": "'from' is required and must be YYYY-MM-DD."},
            status_code=400,
        )
    if not date_to or not DATE_PATTERN.match(date_to):
        return JSONResponse(
            {"error": "Invalid 'to' date",
             "details": "'to' is required and must be YYYY-MM-DD."},
            status_code=400,
        )
    if date_from > date_to:
        return JSONResponse(
            {"error": "Invalid date range",
             "details": "'from' must be <= 'to'."},
            status_code=400,
        )

    try:
        d_from = dt_date.fromisoformat(date_from)
        d_to = dt_date.fromisoformat(date_to)
    except ValueError as exc:
        return JSONResponse(
            {"error": "Invalid date value", "details": str(exc)},
            status_code=400,
        )

    if (d_to - d_from).days > MAX_RANGE_DAYS:
        return JSONResponse(
            {"error": "Date range too large",
             "details": f"Maximum range is {MAX_RANGE_DAYS} days."},
            status_code=400,
        )

    massive_ticker = "C:" + ticker
    url = (f"{MASSIVE_BASE_URL}/{massive_ticker}/range/1/day/"
           f"{date_from}/{date_to}?apiKey={api_key}")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10)
        except httpx.RequestError as exc:
            return JSONResponse(
                {"error": "Upstream request failed", "details": str(exc)},
                status_code=502,
            )

    if resp.status_code != 200:
        return JSONResponse(
            {"error": f"Massive API returned {resp.status_code}",
             "details": resp.text[:500]},
            status_code=resp.status_code,
        )

    try:
        raw = resp.json()
    except ValueError:
        return JSONResponse(
            {"error": "Invalid JSON from Massive API",
             "details": resp.text[:500]},
            status_code=502,
        )

    rows = _parse_response(raw, date_from)
    rows.sort(key=lambda r: r["date"])

    return {
        "ticker": ticker,
        "name": TICKER_NAMES[ticker],
        "massiveTicker": massive_ticker,
        "from": date_from,
        "to": date_to,
        "rows": rows,
    }


def _parse_response(raw, fallback_date: str) -> list[dict]:
    """Normalize the Massive API response into [{date, close}, ...]."""
    if isinstance(raw, dict):
        top_results = raw.get("results") or raw.get("data")
    elif isinstance(raw, list):
        top_results = raw
    else:
        return []

    if not isinstance(top_results, list) or len(top_results) == 0:
        return []

    if _is_day_bucket(top_results[0]):
        rows = []
        for day_obj in top_results:
            day_date = day_obj.get("date", "")
            for item in day_obj.get("results", []):
                if item.get("c") is not None:
                    rows.append({"date": day_date, "close": item["c"]})
                    break
        return rows

    rows = []
    for item in top_results:
        close = item.get("c")
        if close is None:
            continue
        ts = item.get("t")
        if ts is not None:
            item_date = datetime.fromtimestamp(
                ts / 1000, tz=timezone.utc
            ).strftime("%Y-%m-%d")
        else:
            item_date = fallback_date
        rows.append({"date": item_date, "close": close})
    return rows


def _is_day_bucket(obj):
    return isinstance(obj, dict) and "date" in obj and "results" in obj
