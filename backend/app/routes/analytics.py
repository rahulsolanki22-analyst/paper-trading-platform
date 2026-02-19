from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.user import User
from app.models.order import OrderHistory
from app.models.trade import Trade
from app.models.portfolio import Portfolio
from app.models.portfolio_snapshot import PortfolioSnapshot
from app.services.market_data import get_live_price
from app.utils.auth import get_db, get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/summary")
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive trading performance summary."""
    
    # Get all orders for this user
    orders = db.query(OrderHistory).filter(
        OrderHistory.user_id == current_user.id
    ).all()
    
    # Calculate metrics
    sell_orders = [o for o in orders if o.order_type == "SELL"]
    buy_orders = [o for o in orders if o.order_type == "BUY"]
    
    total_trades = len(orders)
    total_buys = len(buy_orders)
    total_sells = len(sell_orders)
    
    # P&L calculations
    total_realized_pnl = sum(o.realized_pnl for o in sell_orders)
    winning_trades = [o for o in sell_orders if o.realized_pnl > 0]
    losing_trades = [o for o in sell_orders if o.realized_pnl < 0]
    
    win_count = len(winning_trades)
    loss_count = len(losing_trades)
    win_rate = (win_count / len(sell_orders) * 100) if sell_orders else 0
    
    # Average win/loss
    avg_win = sum(o.realized_pnl for o in winning_trades) / win_count if win_count else 0
    avg_loss = sum(o.realized_pnl for o in losing_trades) / loss_count if loss_count else 0
    
    # Profit factor
    total_wins = sum(o.realized_pnl for o in winning_trades)
    total_losses = abs(sum(o.realized_pnl for o in losing_trades))
    profit_factor = total_wins / total_losses if total_losses > 0 else 0
    
    # Get current portfolio value
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    cash_balance = portfolio.balance if portfolio else 100000
    
    # Calculate holdings value
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    holdings_value = 0
    for trade in trades:
        current_price = get_live_price(trade.symbol)
        holdings_value += trade.quantity * current_price
    
    total_portfolio_value = cash_balance + holdings_value
    total_return = total_portfolio_value - 100000  # Initial capital
    total_return_percent = (total_return / 100000) * 100
    
    # Best and worst trades
    best_trade = max(sell_orders, key=lambda o: o.realized_pnl) if sell_orders else None
    worst_trade = min(sell_orders, key=lambda o: o.realized_pnl) if sell_orders else None
    
    return {
        "total_trades": total_trades,
        "total_buys": total_buys,
        "total_sells": total_sells,
        "win_count": win_count,
        "loss_count": loss_count,
        "win_rate": round(win_rate, 2),
        "total_realized_pnl": round(total_realized_pnl, 2),
        "average_win": round(avg_win, 2),
        "average_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2),
        "total_portfolio_value": round(total_portfolio_value, 2),
        "total_return": round(total_return, 2),
        "total_return_percent": round(total_return_percent, 2),
        "cash_balance": round(cash_balance, 2),
        "holdings_value": round(holdings_value, 2),
        "best_trade": {
            "symbol": best_trade.symbol,
            "pnl": round(best_trade.realized_pnl, 2),
            "date": best_trade.timestamp.isoformat() if best_trade.timestamp else None
        } if best_trade else None,
        "worst_trade": {
            "symbol": worst_trade.symbol,
            "pnl": round(worst_trade.realized_pnl, 2),
            "date": worst_trade.timestamp.isoformat() if worst_trade.timestamp else None
        } if worst_trade else None
    }


@router.get("/equity-curve")
def get_equity_curve(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio value history for equity curve chart."""
    
    # Get snapshots from database
    snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.user_id == current_user.id
    ).order_by(PortfolioSnapshot.date.desc()).limit(days).all()
    
    # If no snapshots, generate from order history
    if not snapshots:
        # Build equity curve from order history
        orders = db.query(OrderHistory).filter(
            OrderHistory.user_id == current_user.id
        ).order_by(OrderHistory.timestamp).all()
        
        if not orders:
            # Return single point at initial capital
            return {
                "data": [{
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "value": 100000
                }]
            }
        
        # Group orders by date and calculate running balance
        equity_data = []
        running_balance = 100000
        current_date = None
        
        for order in orders:
            order_date = order.timestamp.strftime("%Y-%m-%d") if order.timestamp else None
            if order_date != current_date:
                if current_date:
                    equity_data.append({
                        "date": current_date,
                        "value": round(running_balance, 2)
                    })
                current_date = order_date
            
            if order.order_type == "BUY":
                running_balance -= order.total_value
            else:  # SELL
                running_balance += order.total_value
        
        # Add final point
        if current_date:
            equity_data.append({
                "date": current_date,
                "value": round(running_balance, 2)
            })
        
        return {"data": equity_data}
    
    # Return snapshots
    return {
        "data": [
            {
                "date": s.date.strftime("%Y-%m-%d"),
                "value": round(s.total_value, 2)
            }
            for s in reversed(snapshots)
        ]
    }


@router.get("/trade-analysis")
def get_trade_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed trade analysis by symbol."""
    
    orders = db.query(OrderHistory).filter(
        OrderHistory.user_id == current_user.id
    ).all()
    
    # Group by symbol
    symbol_stats = {}
    for order in orders:
        if order.symbol not in symbol_stats:
            symbol_stats[order.symbol] = {
                "symbol": order.symbol,
                "total_buys": 0,
                "total_sells": 0,
                "total_buy_value": 0,
                "total_sell_value": 0,
                "realized_pnl": 0,
                "trades": []
            }
        
        stats = symbol_stats[order.symbol]
        if order.order_type == "BUY":
            stats["total_buys"] += 1
            stats["total_buy_value"] += order.total_value
        else:
            stats["total_sells"] += 1
            stats["total_sell_value"] += order.total_value
            stats["realized_pnl"] += order.realized_pnl
        
        stats["trades"].append({
            "type": order.order_type,
            "quantity": order.quantity,
            "price": round(order.price, 2),
            "total": round(order.total_value, 2),
            "pnl": round(order.realized_pnl, 2) if order.order_type == "SELL" else None,
            "date": order.timestamp.isoformat() if order.timestamp else None
        })
    
    # Calculate summary for each symbol
    for symbol, stats in symbol_stats.items():
        stats["total_buy_value"] = round(stats["total_buy_value"], 2)
        stats["total_sell_value"] = round(stats["total_sell_value"], 2)
        stats["realized_pnl"] = round(stats["realized_pnl"], 2)
    
    return {
        "by_symbol": list(symbol_stats.values()),
        "total_symbols_traded": len(symbol_stats)
    }


@router.post("/snapshot")
def create_portfolio_snapshot(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a daily portfolio snapshot (can be called by cron or manually)."""
    
    today = datetime.now().date()
    
    # Check if snapshot already exists for today
    existing = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.user_id == current_user.id,
        PortfolioSnapshot.date == today
    ).first()
    
    if existing:
        return {"message": "Snapshot already exists for today", "snapshot_id": existing.id}
    
    # Get current portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    cash_balance = portfolio.balance if portfolio else 100000
    
    # Calculate holdings value
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    holdings_value = 0
    for trade in trades:
        current_price = get_live_price(trade.symbol)
        holdings_value += trade.quantity * current_price
    
    total_value = cash_balance + holdings_value
    
    # Create snapshot
    snapshot = PortfolioSnapshot(
        user_id=current_user.id,
        date=today,
        total_value=total_value,
        cash_balance=cash_balance,
        holdings_value=holdings_value
    )
    db.add(snapshot)
    db.commit()
    
    return {
        "message": "Snapshot created",
        "snapshot_id": snapshot.id,
        "date": today.isoformat(),
        "total_value": round(total_value, 2)
    }
