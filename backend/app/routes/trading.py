from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade
from app.models.order import OrderHistory
from app.models.pending_order import PendingOrder
from app.services.market_data import fetch_stock_data, get_live_price
from app.services.risk import check_stop_loss
from app.utils.auth import get_db, get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/buy")
def buy_stock(
    symbol: str,
    quantity: int,
    stop_loss: float | None = None,
    take_profit: float | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be positive"
        )

    try:
        # Get user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=400, detail="Portfolio not found")

        # Use robust market data service
        hist = fetch_stock_data(symbol, period="1d", interval="1d")
        if hist is None or hist.empty:
            # Fallback to live price
            price = get_live_price(symbol)
            if price == 0.0:
                raise HTTPException(
                    status_code=503,
                    detail=f"Unable to fetch price for {symbol}. Please try again later."
                )
        else:
            price = float(hist["Close"].iloc[-1])
        total_cost = price * quantity

        if total_cost > portfolio.balance:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        if stop_loss is not None:
            if stop_loss >= price:
                raise HTTPException(
                    status_code=400,
                    detail="Stop-loss must be strictly below buy price"
                )

        if take_profit is not None:
            if take_profit <= price:
                raise HTTPException(
                    status_code=400,
                    detail="Take-profit must be strictly above buy price"
                )

        # Update portfolio balance
        portfolio.balance -= total_cost

        # Update or create trade position (filter by user_id)
        trade = db.query(Trade).filter(
            Trade.symbol == symbol,
            Trade.user_id == current_user.id
        ).first()

        if trade:
            # Update existing holding (weighted average)
            total_qty = trade.quantity + quantity
            trade.buy_price = (
                (trade.buy_price * trade.quantity) + (price * quantity)
            ) / total_qty
            trade.quantity = total_qty

            if stop_loss is not None:
                trade.stop_loss = stop_loss
        else:
            # Create new holding
            trade = Trade(
                user_id=current_user.id,
                symbol=symbol,
                quantity=quantity,
                buy_price=price,
                stop_loss=stop_loss
            )
            db.add(trade)

        # Record order history
        order = OrderHistory(
            user_id=current_user.id,
            symbol=symbol,
            order_type="BUY",
            quantity=quantity,
            price=price,
            total_value=total_cost,
            realized_pnl=0.0
        )
        db.add(order)

        # Create pending order for take-profit if specified
        if take_profit is not None:
            pending = PendingOrder(
                user_id=current_user.id,
                symbol=symbol,
                order_type="SELL",
                quantity=quantity,
                trigger_price=take_profit,
                condition="TAKE_PROFIT",
                status="PENDING"
            )
            db.add(pending)

        db.commit()

        return {
            "message": "Buy order executed",
            "symbol": symbol,
            "quantity": quantity,
            "buy_price": round(price, 2),
            "total_cost": round(total_cost, 2),
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "remaining_balance": round(portfolio.balance, 2),
            "order_id": order.id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in buy_stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sell")
def sell_stock(
    symbol: str,
    quantity: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be positive"
        )

    try:
        # Get user's portfolio
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
        if not portfolio:
            raise HTTPException(status_code=400, detail="Portfolio not found")
            
        # Get user's trade (filter by user_id)
        trade = db.query(Trade).filter(
            Trade.symbol == symbol,
            Trade.user_id == current_user.id
        ).first()

        if not trade:
            raise HTTPException(status_code=400, detail="Stock not owned")

        if quantity > trade.quantity:
            raise HTTPException(status_code=400, detail="Not enough quantity to sell")

        # Use robust market data service
        hist = fetch_stock_data(symbol, period="1d", interval="1d")
        if hist is None or hist.empty:
            # Fallback to live price
            sell_price = get_live_price(symbol)
            if sell_price == 0.0:
                raise HTTPException(
                    status_code=503,
                    detail=f"Unable to fetch price for {symbol}. Please try again later."
                )
        else:
            sell_price = float(hist["Close"].iloc[-1])
        total_value = sell_price * quantity

        # Calculate P&L
        pnl = (sell_price - trade.buy_price) * quantity
        trade.realized_pnl += pnl

        # Update portfolio
        portfolio.balance += total_value
        trade.quantity -= quantity

        # Record order history
        order = OrderHistory(
            user_id=current_user.id,
            symbol=symbol,
            order_type="SELL",
            quantity=quantity,
            price=sell_price,
            total_value=total_value,
            realized_pnl=round(pnl, 2)
        )
        db.add(order)

        # Remove trade if quantity is zero
        if trade.quantity == 0:
            db.delete(trade)

        db.commit()

        return {
            "message": "Sell order executed",
            "symbol": symbol,
            "quantity_sold": quantity,
            "sell_price": round(sell_price, 2),
            "total_value": round(total_value, 2),
            "pnl": round(pnl, 2),
            "balance": round(portfolio.balance, 2),
            "order_id": order.id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error in sell_stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/holdings")
def get_holdings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's holdings."""
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    return [
        {
            "symbol": t.symbol,
            "quantity": t.quantity,
            "avg_buy_price": round(t.buy_price, 2)
        }
        for t in trades
    ]

@router.get("/history")
def get_trade_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's order history (buy/sell orders).
    """
    orders = db.query(OrderHistory).filter(
        OrderHistory.user_id == current_user.id
    ).order_by(OrderHistory.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": o.id,
            "symbol": o.symbol,
            "order_type": o.order_type,
            "quantity": o.quantity,
            "price": round(o.price, 2),
            "total_value": round(o.total_value, 2),
            "realized_pnl": round(o.realized_pnl, 2) if o.order_type == "SELL" else None,
            "timestamp": o.timestamp.isoformat() if o.timestamp else None
        }
        for o in orders
    ]

@router.get("/statistics")
def get_trading_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's trading statistics: total realized P&L, number of trades, etc.
    """
    orders = db.query(OrderHistory).filter(
        OrderHistory.user_id == current_user.id
    ).all()
    
    total_buys = sum(1 for o in orders if o.order_type == "BUY")
    total_sells = sum(1 for o in orders if o.order_type == "SELL")
    total_realized_pnl = sum(o.realized_pnl for o in orders if o.order_type == "SELL")
    total_volume = sum(o.total_value for o in orders)
    
    return {
        "total_trades": len(orders),
        "total_buys": total_buys,
        "total_sells": total_sells,
        "total_realized_pnl": round(total_realized_pnl, 2),
        "total_volume": round(total_volume, 2),
        "win_rate": round((total_sells / len(orders) * 100) if orders else 0, 2)
    }

@router.post("/check-stop-loss")
def trigger_stop_loss(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check and trigger stop-loss orders for current user."""
    check_stop_loss(user_id=current_user.id, db=db)
    return {"status": "Stop-loss check executed"}


@router.get("/pending-orders")
def get_pending_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending conditional orders for current user."""
    orders = db.query(PendingOrder).filter(
        PendingOrder.user_id == current_user.id,
        PendingOrder.status == "PENDING"
    ).order_by(PendingOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        current_price = get_live_price(order.symbol)
        result.append({
            "id": order.id,
            "symbol": order.symbol,
            "order_type": order.order_type,
            "quantity": order.quantity,
            "trigger_price": order.trigger_price,
            "condition": order.condition,
            "trailing_percent": order.trailing_percent,
            "current_price": round(current_price, 2),
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None
        })
    
    return {"pending_orders": result, "count": len(result)}


@router.post("/pending-orders/create")
def create_pending_order(
    symbol: str,
    order_type: str,
    quantity: int,
    trigger_price: float,
    condition: str,
    trailing_percent: float | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new pending conditional order."""
    
    # Validate condition
    valid_conditions = ["STOP_LOSS", "TAKE_PROFIT", "TRAILING_STOP"]
    if condition.upper() not in valid_conditions:
        raise HTTPException(
            status_code=400, 
            detail=f"Condition must be one of: {', '.join(valid_conditions)}"
        )
    
    # Validate order type
    if order_type.upper() not in ["BUY", "SELL"]:
        raise HTTPException(status_code=400, detail="Order type must be BUY or SELL")
    
    # Get current price
    current_price = get_live_price(symbol)
    if current_price == 0:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")
    
    # Validate trigger price based on condition
    if condition.upper() == "STOP_LOSS" and trigger_price >= current_price:
        raise HTTPException(
            status_code=400,
            detail=f"Stop-loss trigger must be below current price (₹{current_price})"
        )
    if condition.upper() == "TAKE_PROFIT" and trigger_price <= current_price:
        raise HTTPException(
            status_code=400,
            detail=f"Take-profit trigger must be above current price (₹{current_price})"
        )
    
    # For trailing stop, validate percent
    if condition.upper() == "TRAILING_STOP":
        if trailing_percent is None or trailing_percent <= 0 or trailing_percent >= 100:
            raise HTTPException(
                status_code=400,
                detail="Trailing percent must be between 0 and 100"
            )
    
    pending = PendingOrder(
        user_id=current_user.id,
        symbol=symbol.upper(),
        order_type=order_type.upper(),
        quantity=quantity,
        trigger_price=trigger_price,
        condition=condition.upper(),
        trailing_percent=trailing_percent,
        status="PENDING"
    )
    db.add(pending)
    db.commit()
    
    return {
        "message": "Pending order created",
        "order_id": pending.id,
        "symbol": symbol.upper(),
        "condition": condition.upper(),
        "trigger_price": trigger_price,
        "current_price": round(current_price, 2)
    }


@router.delete("/pending-orders/{order_id}")
def cancel_pending_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending order."""
    
    order = db.query(PendingOrder).filter(
        PendingOrder.id == order_id,
        PendingOrder.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pending order not found")
    
    if order.status != "PENDING":
        raise HTTPException(status_code=400, detail="Order is not pending")
    
    order.status = "CANCELLED"
    db.commit()
    
    return {"message": "Pending order cancelled", "order_id": order_id}


@router.post("/check-pending-orders")
def check_pending_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check and execute pending orders that meet their trigger conditions."""
    
    pending = db.query(PendingOrder).filter(
        PendingOrder.user_id == current_user.id,
        PendingOrder.status == "PENDING"
    ).all()
    
    triggered = []
    for order in pending:
        current_price = get_live_price(order.symbol)
        should_trigger = False
        
        if order.condition == "STOP_LOSS" and current_price <= order.trigger_price:
            should_trigger = True
        elif order.condition == "TAKE_PROFIT" and current_price >= order.trigger_price:
            should_trigger = True
        elif order.condition == "TRAILING_STOP":
            # For trailing stop, check if price dropped by trailing_percent from peak
            # This is simplified - in production you'd track the peak price
            trailing_trigger = current_price * (1 - order.trailing_percent / 100)
            if current_price <= trailing_trigger:
                should_trigger = True
        
        if should_trigger:
            order.status = "TRIGGERED"
            order.triggered_at = datetime.now()
            triggered.append({
                "id": order.id,
                "symbol": order.symbol,
                "condition": order.condition,
                "trigger_price": order.trigger_price,
                "current_price": round(current_price, 2)
            })
    
    if triggered:
        db.commit()
    
    return {
        "checked": len(pending),
        "triggered": triggered,
        "triggered_count": len(triggered)
    }

