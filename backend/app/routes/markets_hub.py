from __future__ import annotations

import json
import logging
import os
import asyncio
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.services.market_cache import get_json, set_json
from app.services.yahoo_service import YahooService

try:
    from app.services.finnhub_service import FinnhubService  # optional
except Exception:
    FinnhubService = None  # type: ignore

logger = logging.getLogger(__name__)
router = APIRouter()


# -----------------------------
# Providers
# -----------------------------

def _get_yahoo() -> YahooService:
    return YahooService()


def _get_finnhub():
    if FinnhubService is None:
        return None
    try:
        return FinnhubService()
    except Exception:
        return None


def _pick_providers():
    finnhub = _get_finnhub()
    yahoo = _get_yahoo()
    return finnhub, yahoo


def _safe_quote(symbol: str) -> Dict[str, Any]:
    finnhub, yahoo = _pick_providers()
    # Prefer Finnhub if available, fallback to Yahoo.
    if finnhub is not None:
        try:
            q = finnhub.quote(symbol)
            return {
                "symbol": q.get("symbol") or symbol,
                "native_price": float(q.get("native_price") or 0.0),
                "change_pct": float(q.get("change_pct") or 0.0),
            }
        except Exception as e:
            logger.info("Finnhub quote failed, falling back to Yahoo: %s", str(e))

    q = yahoo.quote(symbol)
    return {
        "symbol": q.get("symbol") or symbol,
        "native_price": float(q.get("native_price") or 0.0),
        "change_pct": float(q.get("change_pct") or 0.0),
    }


def _safe_search(query: str) -> List[Dict[str, Any]]:
    finnhub, yahoo = _pick_providers()
    if finnhub is not None:
        try:
            return finnhub.search(query)
        except Exception:
            pass
    return yahoo.search(query)


# -----------------------------
# Models
# -----------------------------

class CategoryResponse(BaseModel):
    category: str
    indices: List[Dict[str, Any]] = []
    trending: List[Dict[str, Any]] = []


# -----------------------------
# HTTP routes
# -----------------------------

@router.get("/indices")
def indices():
    # Indices + selected instruments for the ticker.
    # Return compact structure for UI.
    candidates = [
        "ES=F",   # S&P Futures
        "YM=F",   # Dow Futures
        "NQ=F",   # Nasdaq Futures
        "RTY=F",  # Russell 2000 Futures
        "^VIX",   # VIX Index
        "GC=F",   # Gold futures
        "BTC-USD",# Bitcoin
        "CL=F",   # Crude oil
    ]

    cache_key = "markets_hub:indices"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    out: List[Dict[str, Any]] = []
    yahoo = _get_yahoo()
    for sym in candidates:
        try:
            q = _safe_quote(sym)
            spark = yahoo.sparkline(sym, range_="1d", points=24)
            out.append(
                {
                    "symbol": sym,
                    "native_price": q.get("native_price", 0.0),
                    "change_pct": q.get("change_pct", 0.0),
                    "sparkline": spark,
                }
            )
        except Exception:
            out.append({"symbol": sym, "native_price": 0.0, "change_pct": 0.0, "sparkline": []})

    payload = {"indices": out}
    set_json(cache_key, payload, ttl_seconds=10)
    return payload


@router.get("/top-gainers")
def top_gainers():
    cache_key = "markets_hub:top_gainers"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    # Use a candidate universe (fallback). In production, compute from provider lists.
    universe = [
        "AAPL","MSFT","NVDA","TSLA","META","AMZN","AMD","NFLX","GOOGL","INTC",
        "SHOP","PLTR","SOFI","PYPL","SNAP","COIN","UBER","RBLX"
    ]
    yahoo = _get_yahoo()

    # Best effort movers from yahoo (computed).
    movers = yahoo.top_movers(universe, limit=10)
    payload = {"top_gainers": movers.get("gainers", [])}
    set_json(cache_key, payload, ttl_seconds=20)
    return payload


@router.get("/top-losers")
def top_losers():
    cache_key = "markets_hub:top_losers"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    universe = [
        "AAPL","MSFT","NVDA","TSLA","META","AMZN","AMD","NFLX","GOOGL","INTC",
        "SHOP","PLTR","SOFI","PYPL","SNAP","COIN","UBER","RBLX"
    ]
    yahoo = _get_yahoo()

    movers = yahoo.top_movers(universe, limit=10)
    payload = {"top_losers": movers.get("losers", [])}
    set_json(cache_key, payload, ttl_seconds=20)
    return payload


@router.get("/news")
def news(symbol: Optional[str] = Query(None, min_length=1)):
    # News for ticker feed.
    # When symbol is provided, fetch related news; otherwise provide market headline-like items.
    cache_key = f"markets_hub:news:{symbol or 'all'}"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    # Best-effort via Yahoo unofficial search.
    # This endpoint returns lightweight objects for the UI.
    query = symbol or "markets"
    urls = [
        f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&newsCount=12&quotesCount=0",
        f"https://query1.finance.yahoo.com/v1/finance/search?q={query}&newsCount=12&quotesCount=0",
    ]

    articles: List[Dict[str, Any]] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }

    for url in urls:
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code != 200:
                continue
            data = r.json()
            for n in data.get("news", [])[:12]:
                articles.append(
                    {
                        "title": n.get("title") or "",
                        "source": (n.get("publisher") or "").strip(),
                        "link": n.get("link") or "",
                        "published_at": n.get("providerPublishTime"),
                        "summary": n.get("summary") or "",
                        "symbol": symbol,
                    }
                )
            if articles:
                break
        except Exception:
            continue

    # Ensure fallback
    payload = {"articles": articles}
    set_json(cache_key, payload, ttl_seconds=30)
    return payload


@router.get("/trending")
def trending():
    cache_key = "markets_hub:trending"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    # Best-effort: a hardcoded universe with a popularity/momentum-ish proxy from change_pct.
    universe = [
        "NVDA","AMD","TSLA","AAPL","MSFT","COIN","PLTR","SOFI","MSTR","INTC",
        "META","AMZN","GOOGL","NFLX","SHOP","UPST","RBLX","F"
    ]

    yahoo = _get_yahoo()
    out: List[Dict[str, Any]] = []
    for sym in universe:
        try:
            q = yahoo.quote(sym)
            out.append(
                {
                    "symbol": sym,
                    "native_price": q.get("native_price", 0.0),
                    "change_pct": q.get("change_pct", 0.0),
                    "volume": 0,
                    "momentum": abs(float(q.get("change_pct", 0.0) or 0.0)),
                    "popularity": abs(float(q.get("change_pct", 0.0) or 0.0)),
                    "sparkline": yahoo.sparkline(sym, range_="1d", points=24),
                }
            )
        except Exception:
            continue

    out.sort(key=lambda x: x.get("momentum", 0), reverse=True)
    payload = {"trending": out[:12]}
    set_json(cache_key, payload, ttl_seconds=30)
    return payload


@router.get("/search")
def search(q: str = Query(..., min_length=1)):
    cache_key = f"markets_hub:search:{q.strip().upper()}"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    results = _safe_search(q)
    payload = {"results": results}
    set_json(cache_key, payload, ttl_seconds=30)
    return payload


@router.get("/quote/{symbol}")
def quote(symbol: str):
    sym = (symbol or "").strip().upper()
    if not sym:
        raise HTTPException(status_code=400, detail="Symbol is required")

    cache_key = f"markets_hub:quote:{sym}"
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    q = _safe_quote(sym)
    yahoo = _get_yahoo()
    payload = {
        "quote": {
            "symbol": q.get("symbol"),
            "native_price": q.get("native_price", 0.0),
            "change_pct": q.get("change_pct", 0.0),
            "sparkline_1d": yahoo.sparkline(sym, range_="1d", points=60),
            "sparkline_5d": yahoo.sparkline(sym, range_="5d", points=60),
        }
    }
    set_json(cache_key, payload, ttl_seconds=10)
    return payload


# -----------------------------
# Websocket
# -----------------------------

# NOTE: Public page; websocket is public too.
# Frontend will reconnect automatically.

TICKER_SYMBOLS = [
    "ES=F",
    "YM=F",
    "NQ=F",
    "RTY=F",
    "^VIX",
    "GC=F",
    "BTC-USD",
    "CL=F",
]


async def _ticker_loop(ws: WebSocket):
    yahoo = _get_yahoo()

    while True:
        update: Dict[str, Any] = {}

        # Indices ticker
        indices_payload = []
        for sym in TICKER_SYMBOLS:
            try:
                q = _safe_quote(sym)
                indices_payload.append(
                    {
                        "symbol": sym,
                        "native_price": q.get("native_price", 0.0),
                        "change_pct": q.get("change_pct", 0.0),
                        "sparkline": yahoo.sparkline(sym, range_="1d", points=24),
                    }
                )
            except Exception:
                indices_payload.append(
                    {"symbol": sym, "native_price": 0.0, "change_pct": 0.0, "sparkline": []}
                )

        update["type"] = "ticker"
        update["data"] = {"indices": indices_payload}

        await ws.send_text(json.dumps(update))
        await asyncio.sleep(10)


@router.websocket("/ws/markets-hub")
async def ws_markets_hub(ws: WebSocket):
    await ws.accept()
    try:
        await _ticker_loop(ws)
    except WebSocketDisconnect:
        return
    except Exception:
        # Let the client reconnect
        try:
            await ws.close()
        except Exception:
            pass
        return

