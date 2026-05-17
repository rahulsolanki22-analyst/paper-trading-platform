"""Yahoo Finance fallback provider for Markets Hub.

Uses:
- yfinance for quote and price history
- Yahoo search endpoints for symbol lookup

This module is used when Finnhub fails or is not configured.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import requests
import yfinance as yf

logger = logging.getLogger(__name__)


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
}


class YahooService:
    def search(self, query: str) -> List[Dict[str, Any]]:
        q = (query or "").strip()
        if not q:
            return []

        urls = [
            f"https://query2.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=10&newsCount=0",
            f"https://query1.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=10&newsCount=0",
        ]

        for url in urls:
            try:
                r = requests.get(url, headers=HEADERS, timeout=15)
                if r.status_code != 200:
                    continue
                data = r.json()
                results = []
                for item in data.get("quotes", []):
                    sym = item.get("symbol")
                    name = item.get("shortname") or item.get("longname")
                    exchange = item.get("exchange")
                    if sym and name:
                        results.append({"symbol": sym, "name": name, "exchange": exchange})
                if results:
                    return results
            except Exception as e:
                logger.warning("Yahoo search failed for %s: %s", url, str(e))
        return []

    def quote(self, symbol: str) -> Dict[str, Any]:
        sym = (symbol or "").upper().strip()
        if not sym:
            raise ValueError("Empty symbol")

        t = yf.Ticker(sym)

        # Prefer history for latest + previous close
        try:
            hist = t.history(period="5d", interval="1d", timeout=15)
            if hist is not None and not hist.empty:
                last_close = float(hist["Close"].iloc[-1])
                prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else 0.0
                change_pct = 0.0
                if prev_close > 0:
                    change_pct = round(((last_close - prev_close) / prev_close) * 100, 2)
                return {
                    "symbol": sym,
                    "native_price": last_close,
                    "change_pct": change_pct,
                }
        except Exception:
            pass

        info = {}
        try:
            info = t.info or {}
        except Exception:
            info = {}

        current = info.get("regularMarketPrice") or info.get("currentPrice")
        prev_close = info.get("regularMarketPreviousClose")
        current_f = float(current) if current else 0.0
        prev_f = float(prev_close) if prev_close else 0.0
        change_pct = 0.0
        if prev_f > 0 and current_f > 0:
            change_pct = round(((current_f - prev_f) / prev_f) * 100, 2)

        if current_f <= 0:
            raise RuntimeError("Yahoo quote unavailable")

        return {
            "symbol": sym,
            "native_price": current_f,
            "change_pct": change_pct,
        }

    def sparkline(self, symbol: str, range_: str = "1d", points: int = 30) -> List[float]:
        # We provide a simple line series for the UI sparkline.
        # range_: 1d/5d/1mo
        sym = (symbol or "").upper().strip()
        t = yf.Ticker(sym)
        period_map = {"1d": "1d", "5d": "5d", "1mo": "1mo"}
        period = period_map.get(range_, "1d")

        interval = "5m" if period == "1d" else "1d"
        try:
            hist = t.history(period=period, interval=interval, timeout=15)
            if hist is None or hist.empty:
                return []
            series = hist["Close"].tolist()
            if not series:
                return []
            if len(series) > points:
                series = series[-points:]
            return [float(x) for x in series]
        except Exception:
            return []

    def top_movers(self, candidates: List[str], limit: int = 10) -> Dict[str, List[Dict[str, Any]]]:
        # Best-effort: compute change_pct using quote().
        gainers: List[Dict[str, Any]] = []
        losers: List[Dict[str, Any]] = []
        for sym in candidates:
            try:
                q = self.quote(sym)
                item = {
                    "symbol": sym,
                    "native_price": q.get("native_price", 0.0),
                    "change_pct": q.get("change_pct", 0.0),
                    "sparkline": self.sparkline(sym, range_="5d"),
                }
                if item["change_pct"] >= 0:
                    gainers.append(item)
                else:
                    losers.append(item)
            except Exception:
                continue

        gainers.sort(key=lambda x: x["change_pct"], reverse=True)
        losers.sort(key=lambda x: x["change_pct"])
        return {
            "gainers": gainers[:limit],
            "losers": losers[:limit],
        }

