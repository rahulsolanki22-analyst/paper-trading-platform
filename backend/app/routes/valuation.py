from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade
from app.services.pricing import get_live_price
from app.services.fx import detect_currency, fx_to_inr_rate
from app.utils.auth import get_db, get_current_user
import time
from typing import Optional

try:
    import yfinance as yf
except Exception:
    yf = None

router = APIRouter()

_prev_close_cache = {}
_prev_close_ttl = 600  # 10 minutes

def _get_prev_close_native(symbol: str) -> Optional[float]:
    """Get previous close in native currency with caching."""
    now = time.time()
    cached = _prev_close_cache.get(symbol)
    if cached and (now - cached[1] < _prev_close_ttl):
        return cached[0]
    if yf is None:
        return None
    prev_close = None
    # Try fast_info
    try:
        fi = yf.Ticker(symbol).fast_info
        prev_close = getattr(fi, 'previous_close', None) or fi.get('previous_close') if isinstance(fi, dict) else None
    except Exception:
        prev_close = None
    # Fallback to history
    if prev_close is None:
        try:
            hist = yf.Ticker(symbol).history(period="2d")
            if not hist.empty:
                if len(hist['Close']) >= 2:
                    prev_close = float(hist['Close'].iloc[-2])
                else:
                    prev_close = float(hist['Close'].iloc[-1])
        except Exception:
            prev_close = None
    if prev_close is not None:
        _prev_close_cache[symbol] = (prev_close, now)
    return prev_close

@router.get("/portfolio/valuation")
def portfolio_valuation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's portfolio valuation.
    Values are returned in INR (base currency), with native currency details included per holding.
    """
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    
    if not portfolio:
        # Create portfolio if it doesn't exist
        portfolio = Portfolio(user_id=current_user.id, balance=100000.0)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    # Get user's trades only
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()

    holdings = {}

    for t in trades:
        if t.symbol not in holdings:
            holdings[t.symbol] = {
                "quantity": 0,
                "avg_buy_price": 0.0
            }

        h = holdings[t.symbol]
        total_cost = h["avg_buy_price"] * h["quantity"]
        total_cost += t.buy_price * t.quantity
        h["quantity"] += t.quantity
        h["avg_buy_price"] = total_cost / h["quantity"]

    result = []
    total_holdings_value_base = 0.0
    total_daily_pnl_base = 0.0
    currency_breakdown_native = {}

    for symbol, h in holdings.items():
        # native price and currency
        native_currency = detect_currency(symbol)
        native_price = get_live_price(symbol)

        # conversion to INR
        fx_rate = fx_to_inr_rate(native_currency)
        base_price = native_price * fx_rate
        base_avg_buy = h["avg_buy_price"] * fx_rate

        # values and P&L in base (INR)
        base_value = base_price * h["quantity"]
        base_pnl = (base_price - base_avg_buy) * h["quantity"]

        # daily P&L using previous close
        prev_close_native = _get_prev_close_native(symbol)
        daily_pnl_native = None
        daily_pnl_base = None
        if prev_close_native is not None:
            daily_pnl_native = (native_price - prev_close_native) * h["quantity"]
            daily_pnl_base = daily_pnl_native * fx_rate
            total_daily_pnl_base += daily_pnl_base

        total_holdings_value_base += base_value
        currency_breakdown_native[native_currency] = currency_breakdown_native.get(native_currency, 0.0) + (native_price * h["quantity"])

        result.append({
            "symbol": symbol,
            "quantity": h["quantity"],
            # Base (INR) fields retained under existing keys for frontend compatibility
            "avg_buy_price": round(base_avg_buy, 2),
            "current_price": round(base_price, 2),
            "current_value": round(base_value, 2),
            "unrealized_pnl": round(base_pnl, 2),
            # Extra native fields for transparency
            "native_currency": native_currency,
            "native_avg_buy_price": round(h["avg_buy_price"], 4),
            "native_current_price": round(native_price, 4),
            "fx_to_inr": round(fx_rate, 6),
            # Daily P&L
            "daily_pnl": round(daily_pnl_base, 2) if daily_pnl_base is not None else None,
            "daily_pnl_native": round(daily_pnl_native, 2) if daily_pnl_native is not None else None,
            "prev_close_native": round(prev_close_native, 4) if prev_close_native is not None else None
        })

    return {
        # Cash balance assumed already in INR for paper trading
        "cash_balance": round(portfolio.balance, 2),
        "base_currency": "INR",
        "holdings": result,
        "currency_breakdown_native": {k: round(v, 2) for k, v in currency_breakdown_native.items()},
        "total_portfolio_value": round(portfolio.balance + total_holdings_value_base, 2),
        "daily_portfolio_pnl": round(total_daily_pnl_base, 2)
    }
