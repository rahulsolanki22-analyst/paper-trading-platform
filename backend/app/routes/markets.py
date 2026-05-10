from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import yfinance as yf

from app.models.user import User
from app.models.markets_stock import MarketsStock
from app.services.fx import detect_currency, fx_to_inr_rate
from app.services.market_data import get_live_price
from app.utils.auth import get_current_user, get_db


router = APIRouter()

# Starter symbols for the Markets page grid.
# Seeded per-user only when they have not added any yet.
DEFAULT_MARKETS_STOCKS = [
    # US
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "META",
    "TSLA",
    "NVDA",
    "NFLX",
    # India
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "SBIN.NS",
    "ITC.NS",
]


class MarketsStockCreate(BaseModel):
    symbol: str


def _quote(symbol: str):
    sym = symbol.upper().strip()
    if not sym:
        raise ValueError("Empty symbol")

    # Best-effort info from yfinance
    name = None
    prev_close = None
    try:
        t = yf.Ticker(sym)
        fi = t.fast_info
        prev_close = getattr(fi, "previous_close", None) or (
            fi.get("previous_close") if isinstance(fi, dict) else None
        )
        # name is not in fast_info; fallback to .info
        info = t.info
        name = info.get("shortName") or info.get("longName")
        if prev_close is None:
            prev_close = info.get("regularMarketPreviousClose")
    except Exception:
        pass

    native_price = float(get_live_price(sym))
    if native_price <= 0:
        raise ValueError("Invalid symbol or price unavailable")

    native_currency = detect_currency(sym)
    fx_rate = fx_to_inr_rate(native_currency)
    price_inr = native_price * fx_rate

    change_pct = 0.0
    if prev_close and prev_close > 0:
        change_pct = round(((native_price - float(prev_close)) / float(prev_close)) * 100, 2)

    return {
        "symbol": sym,
        "name": name or sym,
        "change_pct": change_pct,
        # Option C style data
        "native_currency": native_currency,
        "native_price": round(native_price, 4),
        "fx_to_inr": round(fx_rate, 6),
        "price_inr": round(price_inr, 2),
    }


@router.get("/stocks")
def list_markets_stocks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all stocks added to the Markets page grid for the current user,
    including live quote data.
    """
    items = (
        db.query(MarketsStock)
        .filter(MarketsStock.user_id == current_user.id)
        .order_by(MarketsStock.created_at.desc())
        .all()
    )

    # Seed defaults for first-time users (Markets page only; not the Trading watchlist).
    if not items:
        for sym in DEFAULT_MARKETS_STOCKS:
            db.add(MarketsStock(user_id=current_user.id, symbol=sym))
        db.commit()
        items = (
            db.query(MarketsStock)
            .filter(MarketsStock.user_id == current_user.id)
            .order_by(MarketsStock.created_at.desc())
            .all()
        )

    result = []
    for item in items:
        try:
            result.append(_quote(item.symbol))
        except Exception:
            # Keep the symbol visible even if quote fails temporarily
            result.append(
                {
                    "symbol": item.symbol,
                    "name": item.symbol,
                    "change_pct": 0.0,
                    "native_currency": "USD",
                    "native_price": 0.0,
                    "fx_to_inr": 1.0,
                    "price_inr": 0.0,
                }
            )

    return {"stocks": result, "count": len(result)}


@router.post("/stocks")
def add_markets_stock(
    body: MarketsStockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sym = (body.symbol or "").upper().strip()
    if not sym:
        raise HTTPException(status_code=400, detail="Symbol is required")

    # Validate symbol by fetching live price
    try:
        _ = _quote(sym)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")

    existing = (
        db.query(MarketsStock)
        .filter(MarketsStock.user_id == current_user.id, MarketsStock.symbol == sym)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Stock already added")

    item = MarketsStock(user_id=current_user.id, symbol=sym)
    db.add(item)
    db.commit()

    return {"message": "Added", "symbol": sym}


@router.delete("/stocks/{symbol}")
def remove_markets_stock(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sym = (symbol or "").upper().strip()
    item = (
        db.query(MarketsStock)
        .filter(MarketsStock.user_id == current_user.id, MarketsStock.symbol == sym)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found")

    db.delete(item)
    db.commit()
    return {"message": "Removed", "symbol": sym}

