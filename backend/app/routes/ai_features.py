from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.trade import Trade
from app.models.portfolio import Portfolio
from app.models.bot_config import BotConfig
from app.services.market_data import fetch_stock_data, get_live_price
from app.utils.auth import get_db, get_current_user
from app.ml.predict import predict_signal
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/rebalance")
def get_rebalance_suggestions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Calculate suggested portfolio weights based on Inverse Variance (Volatility).
    """
    # 1. Get current holdings
    trades = db.query(Trade).filter(Trade.user_id == current_user["id"]).all()
    
    # Consolidate holdings
    holdings = {}
    for t in trades:
        if t.quantity > 0:
            holdings[t.symbol] = holdings.get(t.symbol, 0) + t.quantity
            
    if not holdings:
        return {"message": "No holdings to rebalance", "suggestions": []}
    
    symbols = list(holdings.keys())
    
    # 2. Fetch historical data for volatility (last 30 days)
    volatilities = {}
    current_prices = {}
    
    for symbol in symbols:
        try:
            df = fetch_stock_data(symbol, period="1mo", interval="1d")
            if df is not None and len(df) > 5:
                # Calculate daily returns
                returns = df["Close"].pct_change().dropna()
                # Calculate annualized volatility
                vol = returns.std() * np.sqrt(252)
                volatilities[symbol] = max(vol, 0.01) # Avoid division by zero
            else:
                volatilities[symbol] = 0.5 # Default to high vol if data missing
                
            current_prices[symbol] = get_live_price(symbol)
        except Exception as e:
            volatilities[symbol] = 0.5
            current_prices[symbol] = 0.0
            
    # 3. Calculate Inverse Variance Weights
    inv_vars = {s: 1.0 / (v**2) for s, v in volatilities.items()}
    total_inv_var = sum(inv_vars.values())
    
    target_weights = {s: iv / total_inv_var for s, iv in inv_vars.items()}
    
    # 4. Get portfolio value
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user["id"]).first()
    holdings_value = sum(holdings.get(s, 0) * current_prices.get(s, 0) for s in symbols)
    total_value = portfolio.balance + holdings_value
    
    # 5. Build suggestions
    suggestions = []
    for s in symbols:
        current_val = holdings.get(s, 0) * current_prices.get(s, 0)
        current_weight = current_val / total_value if total_value > 0 else 0
        target_weight = target_weights.get(s, 0)
        target_val = total_value * target_weight
        
        diff_val = target_val - current_val
        # Suggest trade
        price = current_prices.get(s, 0)
        trade_qty = int(diff_val / price) if price > 0 else 0
        
        suggestions.append({
            "symbol": s,
            "current_quantity": holdings[s],
            "current_price": price,
            "current_weight": round(current_weight, 4),
            "target_weight": round(target_weight, 4),
            "suggested_trade": trade_qty,
            "action": "BUY" if trade_qty > 0 else "SELL" if trade_qty < 0 else "HOLD",
            "volatility": round(volatilities.get(s, 0.5), 4)
        })
        
    return {
        "total_value": round(total_value, 2),
        "cash_balance": round(portfolio.balance, 2),
        "suggestions": suggestions
    }

@router.get("/bot/config")
def get_bot_config(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    config = db.query(BotConfig).filter(BotConfig.user_id == current_user["id"]).first()
    if not config:
        config = BotConfig(user_id=current_user["id"])
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/bot/config")
def update_bot_config(
    active: bool = Body(...),
    confidence_threshold: float = Body(...),
    max_position_size: float = Body(...),
    symbols: str = Body(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(BotConfig).filter(BotConfig.user_id == current_user["id"]).first()
    if not config:
        config = BotConfig(user_id=current_user["id"])
        db.add(config)
    
    config.active = active
    config.confidence_threshold = confidence_threshold
    config.max_position_size = max_position_size
    config.symbols = symbols
    
    db.commit()
    return config

@router.post("/bot/execute")
def execute_bot_strategy(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Manually trigger the bot to check signals and execute trades for configured symbols.
    In a real app, this would be a background task.
    """
    from app.routes.trading import buy_stock, sell_stock
    
    config = db.query(BotConfig).filter(BotConfig.user_id == current_user["id"]).first()
    if not config or not config.active:
        return {"status": "Bot is inactive"}
    
    symbols = [s.strip() for s in config.symbols.split(",") if s.strip()]
    results = []
    
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user["id"]).first()
    
    for symbol in symbols:
        try:
            signal_data = predict_signal(symbol)
            confidence = signal_data["confidence_percent"]
            dominant = signal_data["dominant_signal"]
            price = signal_data["price"]
            
            if confidence >= config.confidence_threshold:
                if dominant == "BUY":
                    # Check if we already have a position
                    existing = db.query(Trade).filter(Trade.user_id == current_user["id"], Trade.symbol == symbol, Trade.quantity > 0).first()
                    if not existing:
                        # Buy up to max_position_size
                        qty = int(config.max_position_size / price)
                        if qty > 0 and (qty * price) <= portfolio.balance:
                            buy_stock(symbol, qty, current_user, db)
                            results.append(f"Bot BOUGHT {qty} {symbol} (Confidence: {confidence}%)")
                        else:
                            results.append(f"Bot skipped BUY {symbol}: Insufficient funds or small qty")
                    else:
                        results.append(f"Bot skipped BUY {symbol}: Position already exists")
                        
                elif dominant == "SELL":
                    existing = db.query(Trade).filter(Trade.user_id == current_user["id"], Trade.symbol == symbol, Trade.quantity > 0).first()
                    if existing:
                        sell_stock(symbol, existing.quantity, current_user, db)
                        results.append(f"Bot SOLD {existing.quantity} {symbol} (Confidence: {confidence}%)")
                    else:
                        results.append(f"Bot skipped SELL {symbol}: No position found")
            else:
                results.append(f"Bot HOLD {symbol}: Confidence {confidence}% below threshold {config.confidence_threshold}%")
                
        except Exception as e:
            logger.error(f"Bot error for {symbol}: {str(e)}")
            results.append(f"Bot ERROR {symbol}: {str(e)}")
            
    return {"status": "Execution complete", "results": results}
