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


@router.get("/")
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's watchlist with current prices."""
    
    items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).order_by(Watchlist.added_at.desc()).all()
    
    result = []
    for item in items:
        native_price = float(get_live_price(item.symbol))
        native_currency = detect_currency(item.symbol)
        fx_rate = fx_to_inr_rate(native_currency)
        current_price_inr = native_price * fx_rate
        result.append({
            "id": item.id,
            "symbol": item.symbol,
            "notes": item.notes,
            # Native + INR prices for UI (Option C)
            "native_currency": native_currency,
            "native_price": round(native_price, 4),
            "fx_to_inr": round(fx_rate, 6),
            "current_price_inr": round(current_price_inr, 2),
            "added_at": item.added_at.isoformat() if item.added_at else None
        })
    
    return {"watchlist": result, "count": len(result)}


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
