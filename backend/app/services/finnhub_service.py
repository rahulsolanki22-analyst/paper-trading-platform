"""Finnhub provider integration for Markets Hub.

This file is intentionally defensive:
- If Finnhub key is missing, raises RuntimeError.
- If network/API fails, raises RuntimeError.

The main Markets Hub routes will fallback to Yahoo provider.
"""

from __future__ import annotations

import os
import requests
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class FinnhubService:
    def __init__(self):
        self.api_key = os.getenv("FINNHUB_API_KEY")
        if not self.api_key:
            raise RuntimeError("FINNHUB_API_KEY is not configured")

    def _headers(self) -> Dict[str, str]:
        return {"X-Finnhub-Token": self.api_key}

    def search(self, query: str) -> List[Dict[str, Any]]:
        url = "https://finnhub.io/api/v1/search"
        params = {"q": query, "token": self.api_key}
        r = requests.get(url, params=params, timeout=15)
        if r.status_code != 200:
            raise RuntimeError(f"Finnhub search failed: {r.status_code} {r.text}")
        data = r.json()
        out = []
        for item in data.get("result", []):
            sym = item.get("symbol")
            if not sym:
                continue
            out.append(
                {
                    "symbol": sym,
                    "name": item.get("description") or sym,
                    "exchange": item.get("exchange") or "",
                }
            )
        return out

    def quote(self, symbol: str) -> Dict[str, Any]:
        url = "https://finnhub.io/api/v1/quote"
        params = {"symbol": symbol, "token": self.api_key}
        r = requests.get(url, params=params, timeout=15)
        if r.status_code != 200:
            raise RuntimeError(f"Finnhub quote failed: {r.status_code} {r.text}")
        data = r.json()
        # Finnhub quote fields: c (current), pc (prev close)
        current = float(data.get("c") or 0)
        prev_close = float(data.get("pc") or 0)
        change_pct = 0.0
        if prev_close > 0 and current > 0:
            change_pct = round(((current - prev_close) / prev_close) * 100, 2)
        return {
            "symbol": symbol.upper(),
            "native_price": current,
            "change_pct": change_pct,
        }

    def movers_top_gainers_losers(self, category: str = "US") -> Dict[str, List[Dict[str, Any]]]:
        # Finnhub provides stock indices and market news; movers endpoints vary.
        # We will implement best-effort with a fallback list.
        # This endpoint is mainly used to satisfy API contract; Yahoo fallback is used in production.
        raise RuntimeError("Finnhub movers endpoint not implemented for this project")

