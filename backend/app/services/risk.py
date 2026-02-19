import yfinance as yf
from sqlalchemy.orm import Session
from app.models.trade import Trade
from app.models.portfolio import Portfolio
from app.services.market_data import get_live_price

def check_stop_loss(user_id: int = None, db: Session = None):
    """
    Check and trigger stop-loss orders.
    If user_id is provided, only check that user's trades.
    If db is provided, use that session; otherwise create a new one.
    """
    from app.database import SessionLocal
    
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    try:
        # Get trades (filter by user_id if provided)
        if user_id:
            trades = db.query(Trade).filter(Trade.user_id == user_id).all()
            portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        else:
            trades = db.query(Trade).all()
            portfolio = db.query(Portfolio).first()
        
        if not portfolio:
            return

        for trade in trades:
            if trade.stop_loss is None:
                continue

            # Get current price
            price = get_live_price(trade.symbol)
            if price == 0.0:
                continue

            if price <= trade.stop_loss:
                # Trigger stop-loss
                pnl = (price - trade.buy_price) * trade.quantity
                trade.realized_pnl += pnl
                portfolio.balance += price * trade.quantity
                db.delete(trade)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if should_close:
            db.close()
