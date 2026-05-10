"""
FX utilities for converting native instrument currencies to INR.

The app's paper-trading cash balance is treated as INR, so trading and valuation
must convert non-INR instruments to INR consistently.
"""

from __future__ import annotations

import time
from typing import Optional

import logging

logger = logging.getLogger(__name__)

try:
    import yfinance as yf
except Exception:  # pragma: no cover
    yf = None

# Simple in-process cache for FX rates to INR
_fx_cache: dict[str, tuple[float, float]] = {}
_fx_ttl_seconds = 600  # 10 minutes


def detect_currency(symbol: str) -> str:
    """Best-effort detection of a symbol's native currency."""
    sym = (symbol or "").upper()
    # Common India tickers
    if sym.endswith(".NS") or sym.endswith(".BSE") or sym.endswith(".BO"):
        return "INR"

    if yf is None:
        return "USD"

    # Prefer fast_info
    try:
        info = yf.Ticker(sym).fast_info
        curr = getattr(info, "currency", None) or (
            info.get("currency") if isinstance(info, dict) else None
        )
        if curr:
            return str(curr).upper()
    except Exception:
        pass

    # Fallback to .info
    try:
        info = yf.Ticker(sym).info
        curr = info.get("currency")
        if curr:
            return str(curr).upper()
    except Exception:
        pass

    return "USD"


def fx_to_inr_rate(currency: str) -> float:
    """
    Get FX rate to INR for a currency. Returns 1.0 for INR.

    Uses Yahoo Finance pairs like 'USDINR=X'.
    """
    curr = (currency or "USD").upper()
    if curr == "INR":
        return 1.0

    key = f"{curr}->INR"
    now = time.time()
    cached = _fx_cache.get(key)
    if cached and (now - cached[1] < _fx_ttl_seconds):
        return cached[0]

    if yf is None:
        return 1.0

    pair = f"{curr}INR=X"
    rate: Optional[float] = None
    try:
        finfo = yf.Ticker(pair).fast_info
        rate = getattr(finfo, "last_price", None) or (
            finfo.get("last_price") if isinstance(finfo, dict) else None
        )
    except Exception:
        rate = None

    if rate is None:
        try:
            hist = yf.Ticker(pair).history(period="1d")
            if not hist.empty:
                rate = float(hist["Close"].iloc[-1])
        except Exception:
            rate = None

    if not rate or rate <= 0:
        logger.warning("FX rate unavailable for %s, falling back to 1.0", pair)
        rate = 1.0

    _fx_cache[key] = (float(rate), now)
    return float(rate)

