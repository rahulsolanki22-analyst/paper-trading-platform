from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.watchlist import Watchlist, PriceAlert
from app.services.market_data import get_live_price
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
        current_price = get_live_price(item.symbol)
        result.append({
            "id": item.id,
            "symbol": item.symbol,
            "notes": item.notes,
            "current_price": round(current_price, 2),
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
    price = get_live_price(symbol)
    if price == 0:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")
    
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
        "current_price": round(price, 2)
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
