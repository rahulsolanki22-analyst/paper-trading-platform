from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.watchlist import Watchlist, PriceAlert
from app.services.market_data import get_live_price
from app.services.fx import detect_currency, fx_to_inr_rate
from app.utils.auth import get_db, get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


import time
from concurrent.futures import ThreadPoolExecutor

DEFAULT_STOCKS_NAMES = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corporation",
    "GOOGL": "Alphabet Inc.",
    "AMZN": "Amazon.com, Inc.",
    "META": "Meta Platforms, Inc.",
    "TSLA": "Tesla, Inc.",
    "NVDA": "NVIDIA Corporation",
    "NFLX": "Netflix, Inc.",
    "RELIANCE.NS": "Reliance Industries Limited",
    "TCS.NS": "Tata Consultancy Services Limited",
    "INFY.NS": "Infosys Limited",
    "HDFCBANK.NS": "HDFC Bank Limited",
    "ICICIBANK.NS": "ICICI Bank Limited",
    "SBIN.NS": "State Bank of India",
    "ITC.NS": "ITC Limited",
}

_metadata_cache = {}  # {sym: {"name": ..., "prev_close": ..., "timestamp": ...}}
_metadata_ttl = 3600 * 4

_quote_cache = {}
_quote_ttl = 30

def _get_watchlist_quote(symbol: str):
    sym = symbol.upper().strip()
    if not sym:
        return None
    
    now = time.time()
    
    # Try quote cache first
    cached_q = _quote_cache.get(sym)
    if cached_q and (now - cached_q[1] < _quote_ttl):
        return cached_q[0]
        
    name = DEFAULT_STOCKS_NAMES.get(sym)
    prev_close = None
    
    cached_meta = _metadata_cache.get(sym)
    if cached_meta and (now - cached_meta["timestamp"] < _metadata_ttl):
        if not name:
            name = cached_meta.get("name")
        prev_close = cached_meta.get("prev_close")
        
    if not name or prev_close is None:
        try:
            import yfinance as yf
            t = yf.Ticker(sym)
            fi = t.fast_info
            if prev_close is None:
                prev_close = getattr(fi, "previous_close", None) or (
                    fi.get("previous_close") if isinstance(fi, dict) else None
                )
            if not name:
                info = t.info
                name = info.get("shortName") or info.get("longName")
                if prev_close is None:
                    prev_close = info.get("regularMarketPreviousClose")
            
            _metadata_cache[sym] = {
                "name": name,
                "prev_close": prev_close,
                "timestamp": now
            }
        except Exception:
            pass
            
    native_price = float(get_live_price(sym))
    native_currency = detect_currency(sym)
    fx_rate = fx_to_inr_rate(native_currency)
    current_price_inr = native_price * fx_rate
    
    change_pct = 0.0
    if prev_close and prev_close > 0:
        change_pct = round(((native_price - float(prev_close)) / float(prev_close)) * 100, 2)
        
    res = {
        "symbol": sym,
        "name": name or sym,
        "change_pct": change_pct,
        "native_currency": native_currency,
        "native_price": round(native_price, 4),
        "fx_to_inr": round(fx_rate, 6),
        "current_price_inr": round(current_price_inr, 2),
    }
    _quote_cache[sym] = (res, now)
    return res


@router.get("/")
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's watchlist with current prices."""
    
    items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).order_by(Watchlist.added_at.desc()).all()
    
    def fetch_one(item):
        try:
            q = _get_watchlist_quote(item.symbol)
            if q:
                return {
                    "id": item.id,
                    "symbol": item.symbol,
                    "notes": item.notes,
                    "name": q["name"],
                    "change_pct": q["change_pct"],
                    "native_currency": q["native_currency"],
                    "native_price": q["native_price"],
                    "fx_to_inr": q["fx_to_inr"],
                    "current_price_inr": q["current_price_inr"],
                    "added_at": item.added_at.isoformat() if item.added_at else None
                }
        except Exception:
            pass
            
        # Fallback
        return {
            "id": item.id,
            "symbol": item.symbol,
            "notes": item.notes,
            "name": item.symbol,
            "change_pct": 0.0,
            "native_currency": "USD",
            "native_price": 0.0,
            "fx_to_inr": 1.0,
            "current_price_inr": 0.0,
            "added_at": item.added_at.isoformat() if item.added_at else None
        }
        
    with ThreadPoolExecutor(max_workers=10) as executor:
        result = list(executor.map(fetch_one, items))
    
    return {"watchlist": result, "count": len(result)}


@router.get("/preview")
def get_watchlist_preview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's watchlist in preview format for the Markets Hub page."""
    data = get_watchlist(current_user=current_user, db=db)
    return {"items": data["watchlist"]}


@router.post("/add")
def add_to_watchlist(
    symbol: str,
    notes: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a stock to watchlist."""
    
    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == symbol
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")
    
    # Verify symbol is valid by checking price
    native_price = float(get_live_price(symbol))
    if native_price == 0:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")

    native_currency = detect_currency(symbol)
    fx_rate = fx_to_inr_rate(native_currency)
    current_price_inr = native_price * fx_rate
    
    item = Watchlist(
        user_id=current_user.id,
        symbol=symbol.upper(),
        notes=notes
    )
    db.add(item)
    db.commit()
    
    return {
        "message": "Added to watchlist",
        "symbol": symbol.upper(),
        "native_currency": native_currency,
        "native_price": round(native_price, 4),
        "fx_to_inr": round(fx_rate, 6),
        "current_price_inr": round(current_price_inr, 2),
    }


@router.delete("/{symbol}")
def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a stock from watchlist."""
    
    item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == symbol.upper()
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Removed from watchlist", "symbol": symbol}


@router.put("/{symbol}/notes")
def update_watchlist_notes(
    symbol: str,
    notes: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notes for a watchlist item."""
    
    item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.symbol == symbol.upper()
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
    
    item.notes = notes
    db.commit()
    
    return {"message": "Notes updated", "symbol": symbol, "notes": notes}
