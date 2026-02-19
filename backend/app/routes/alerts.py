from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.watchlist import PriceAlert
from app.services.market_data import get_live_price
from app.utils.auth import get_db, get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_alerts(
    include_triggered: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's price alerts."""
    
    query = db.query(PriceAlert).filter(PriceAlert.user_id == current_user.id)
    
    if not include_triggered:
        query = query.filter(PriceAlert.is_triggered == False)
    
    alerts = query.order_by(PriceAlert.created_at.desc()).all()
    
    result = []
    for alert in alerts:
        current_price = get_live_price(alert.symbol)
        result.append({
            "id": alert.id,
            "symbol": alert.symbol,
            "target_price": alert.target_price,
            "condition": alert.condition,
            "current_price": round(current_price, 2),
            "is_triggered": alert.is_triggered,
            "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
            "created_at": alert.created_at.isoformat() if alert.created_at else None
        })
    
    return {"alerts": result, "count": len(result)}


@router.post("/create")
def create_alert(
    symbol: str,
    target_price: float,
    condition: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new price alert."""
    
    # Validate condition
    if condition.upper() not in ["ABOVE", "BELOW"]:
        raise HTTPException(status_code=400, detail="Condition must be ABOVE or BELOW")
    
    # Verify symbol
    current_price = get_live_price(symbol)
    if current_price == 0:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")
    
    # Check if alert makes sense
    if condition.upper() == "ABOVE" and target_price <= current_price:
        raise HTTPException(
            status_code=400, 
            detail=f"Target price must be above current price (₹{current_price})"
        )
    if condition.upper() == "BELOW" and target_price >= current_price:
        raise HTTPException(
            status_code=400, 
            detail=f"Target price must be below current price (₹{current_price})"
        )
    
    alert = PriceAlert(
        user_id=current_user.id,
        symbol=symbol.upper(),
        target_price=target_price,
        condition=condition.upper()
    )
    db.add(alert)
    db.commit()
    
    return {
        "message": "Alert created",
        "alert_id": alert.id,
        "symbol": symbol.upper(),
        "target_price": target_price,
        "condition": condition.upper(),
        "current_price": round(current_price, 2)
    }


@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a price alert."""
    
    alert = db.query(PriceAlert).filter(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted", "alert_id": alert_id}


@router.get("/check")
def check_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check all active alerts and trigger those that meet conditions."""
    
    alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id,
        PriceAlert.is_triggered == False
    ).all()
    
    triggered = []
    for alert in alerts:
        current_price = get_live_price(alert.symbol)
        
        should_trigger = False
        if alert.condition == "ABOVE" and current_price >= alert.target_price:
            should_trigger = True
        elif alert.condition == "BELOW" and current_price <= alert.target_price:
            should_trigger = True
        
        if should_trigger:
            alert.is_triggered = True
            alert.triggered_at = datetime.now()
            triggered.append({
                "id": alert.id,
                "symbol": alert.symbol,
                "target_price": alert.target_price,
                "condition": alert.condition,
                "current_price": round(current_price, 2)
            })
    
    if triggered:
        db.commit()
    
    return {
        "checked": len(alerts),
        "triggered": triggered,
        "triggered_count": len(triggered)
    }


@router.get("/triggered")
def get_triggered_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recently triggered alerts."""
    
    alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id,
        PriceAlert.is_triggered == True
    ).order_by(PriceAlert.triggered_at.desc()).limit(20).all()
    
    return {
        "triggered_alerts": [
            {
                "id": a.id,
                "symbol": a.symbol,
                "target_price": a.target_price,
                "condition": a.condition,
                "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None
            }
            for a in alerts
        ]
    }
