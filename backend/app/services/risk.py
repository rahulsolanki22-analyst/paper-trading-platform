from sqlalchemy.orm import Session
from app.models.trade import Trade
from app.models.portfolio import Portfolio
from app.services.market_data import get_live_price
from app.services.fx import detect_currency, fx_to_inr_rate

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

            # Get current price in native currency
            price = get_live_price(trade.symbol)
            if price == 0.0:
                continue

            if price <= float(trade.stop_loss):
                # Convert to INR for portfolio balance
                native_currency = detect_currency(trade.symbol)
                fx_rate = fx_to_inr_rate(native_currency)
                price_inr = price * fx_rate
                buy_price_inr = float(trade.buy_price) * fx_rate
                
                pnl = (price_inr - buy_price_inr) * trade.quantity
                trade.realized_pnl = float(trade.realized_pnl) + pnl
                portfolio.balance = float(portfolio.balance) + (price_inr * trade.quantity)
                db.delete(trade)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if should_close:
            db.close()
