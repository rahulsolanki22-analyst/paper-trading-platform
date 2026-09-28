"""
Demo data seeder for paper trading account rahul@gmail.com.
Sets up starting capital of ₹1,00,000 and 20 realistic historical trades.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade
from app.models.order import OrderHistory
from app.models.portfolio_snapshot import PortfolioSnapshot
from app.models.diary import TradeDiary
from app.models.pending_order import PendingOrder
from app.models.watchlist import Watchlist
import logging

logger = logging.getLogger(__name__)

# List of 20 realistic Indian stock transactions starting from ₹1,00,000 capital
# All timestamps are in ISO format (IST timezone +05:30)
SEED_TRANSACTIONS = [
    # 1. BUY RELIANCE
    {
        "symbol": "RELIANCE.NS",
        "company": "Reliance Industries Ltd",
        "type": "BUY",
        "qty": 15,
        "price": 1240.00,
        "timestamp": "2026-03-15T10:15:00+05:30",
        "note": "Technical breakout entry above resistance."
    },
    # 2. BUY TCS
    {
        "symbol": "TCS.NS",
        "company": "Tata Consultancy Services Ltd",
        "type": "BUY",
        "qty": 10,
        "price": 2200.00,
        "timestamp": "2026-03-20T11:30:00+05:30",
        "note": "Strong Q3 earnings results and bullish momentum."
    },
    # 3. BUY INFY
    {
        "symbol": "INFY.NS",
        "company": "Infosys Ltd",
        "type": "BUY",
        "qty": 25,
        "price": 1080.00,
        "timestamp": "2026-03-28T14:00:00+05:30",
        "note": "Value buy at 50-day moving average support."
    },
    # 4. BUY ITC
    {
        "symbol": "ITC.NS",
        "company": "ITC Ltd",
        "type": "BUY",
        "qty": 50,
        "price": 255.00,
        "timestamp": "2026-04-05T10:45:00+05:30",
        "note": "High dividend yield pick with steady growth."
    },
    # 5. SELL TCS (Partial - Profitable)
    {
        "symbol": "TCS.NS",
        "company": "Tata Consultancy Services Ltd",
        "type": "SELL",
        "qty": 4,
        "price": 2310.00,
        "timestamp": "2026-04-12T11:15:00+05:30",
        "note": "Booked partial profit near target 1."
    },
    # 6. SELL ITC (Complete - Profitable)
    {
        "symbol": "ITC.NS",
        "company": "ITC Ltd",
        "type": "SELL",
        "qty": 50,
        "price": 268.00,
        "timestamp": "2026-04-20T15:00:00+05:30",
        "note": "Hit final take-profit target cleanly."
    },
    # 7. BUY HDFCBANK
    {
        "symbol": "HDFCBANK.NS",
        "company": "HDFC Bank Ltd",
        "type": "BUY",
        "qty": 30,
        "price": 700.00,
        "timestamp": "2026-05-02T09:45:00+05:30",
        "note": "Banking sector rebound entry."
    },
    # 8. BUY SBIN
    {
        "symbol": "SBIN.NS",
        "company": "State Bank of India",
        "type": "BUY",
        "qty": 15,
        "price": 1020.00,
        "timestamp": "2026-05-10T13:20:00+05:30",
        "note": "PSU Bank rally anticipation."
    },
    # 9. SELL INFY (Partial - Small Loss)
    {
        "symbol": "INFY.NS",
        "company": "Infosys Ltd",
        "type": "SELL",
        "qty": 10,
        "price": 1050.00,
        "timestamp": "2026-05-18T14:40:00+05:30",
        "note": "Trimmed position on short-term weakness."
    },
    # 10. BUY ICICIBANK
    {
        "symbol": "ICICIBANK.NS",
        "company": "ICICI Bank Ltd",
        "type": "BUY",
        "qty": 10,
        "price": 1380.00,
        "timestamp": "2026-05-25T10:30:00+05:30",
        "note": "Strong credit growth outlook."
    },
    # 11. SELL SBIN (Complete - Profitable)
    {
        "symbol": "SBIN.NS",
        "company": "State Bank of India",
        "type": "SELL",
        "qty": 15,
        "price": 1070.00,
        "timestamp": "2026-06-03T11:00:00+05:30",
        "note": "Closed PSU trade with steady profit."
    },
    # 12. BUY RELIANCE (Add position)
    {
        "symbol": "RELIANCE.NS",
        "company": "Reliance Industries Ltd",
        "type": "BUY",
        "qty": 5,
        "price": 1270.00,
        "timestamp": "2026-06-12T12:15:00+05:30",
        "note": "Added on pullback continuation."
    },
    # 13. BUY LT
    {
        "symbol": "LT.NS",
        "company": "Larsen & Toubro Ltd",
        "type": "BUY",
        "qty": 2,
        "price": 3950.00,
        "timestamp": "2026-06-20T14:15:00+05:30",
        "note": "Infra order book expansion trade."
    },
    # 14. SELL RELIANCE (Partial - Profitable)
    {
        "symbol": "RELIANCE.NS",
        "company": "Reliance Industries Ltd",
        "type": "SELL",
        "qty": 5,
        "price": 1310.00,
        "timestamp": "2026-07-01T10:00:00+05:30",
        "note": "Locked in profit at psychological resistance."
    },
    # 15. SELL LT (Complete - Small Loss)
    {
        "symbol": "LT.NS",
        "company": "Larsen & Toubro Ltd",
        "type": "SELL",
        "qty": 2,
        "price": 3900.00,
        "timestamp": "2026-07-08T11:30:00+05:30",
        "note": "Cut loss early as trend stalled."
    },
    # 16. BUY TCS (Add position)
    {
        "symbol": "TCS.NS",
        "company": "Tata Consultancy Services Ltd",
        "type": "BUY",
        "qty": 2,
        "price": 2240.00,
        "timestamp": "2026-07-15T15:10:00+05:30",
        "note": "Re-entered on dip after strong margin report."
    },
    # 17. SELL HDFCBANK (Partial - Profitable)
    {
        "symbol": "HDFCBANK.NS",
        "company": "HDFC Bank Ltd",
        "type": "SELL",
        "qty": 10,
        "price": 735.00,
        "timestamp": "2026-07-25T10:20:00+05:30",
        "note": "Partial profit booking."
    },
    # 18. BUY INFY (Add position)
    {
        "symbol": "INFY.NS",
        "company": "Infosys Ltd",
        "type": "BUY",
        "qty": 5,
        "price": 1100.00,
        "timestamp": "2026-08-04T13:45:00+05:30",
        "note": "Accumulated on trend reversal signal."
    },
    # 19. SELL ICICIBANK (Partial - Profitable)
    {
        "symbol": "ICICIBANK.NS",
        "company": "ICICI Bank Ltd",
        "type": "SELL",
        "qty": 3,
        "price": 1410.00,
        "timestamp": "2026-08-12T11:00:00+05:30",
        "note": "Booked partial profits."
    },
    # 20. BUY ITC (Re-entry)
    {
        "symbol": "ITC.NS",
        "company": "ITC Ltd",
        "type": "BUY",
        "qty": 20,
        "price": 265.00,
        "timestamp": "2026-08-20T14:30:00+05:30",
        "note": "Re-entered defensive FMCG position."
    }
]

WATCHLIST_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS",
    "ICICIBANK.NS", "ITC.NS", "SBIN.NS", "LT.NS"
]


def clear_user_trading_data(db: Session, user_id: int):
    """Safely clear all trading records for a user without deleting the user account."""
    db.query(Trade).filter(Trade.user_id == user_id).delete()
    db.query(OrderHistory).filter(OrderHistory.user_id == user_id).delete()
    db.query(PortfolioSnapshot).filter(PortfolioSnapshot.user_id == user_id).delete()
    db.query(TradeDiary).filter(TradeDiary.user_id == user_id).delete()
    db.query(PendingOrder).filter(PendingOrder.user_id == user_id).delete()
    db.query(Watchlist).filter(Watchlist.user_id == user_id).delete()
    
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if portfolio:
        portfolio.balance = 100000.0
    else:
        portfolio = Portfolio(user_id=user_id, balance=100000.0)
        db.add(portfolio)
        
    db.commit()


def seed_demo_data_for_user(db: Session, email: str = "rahul@gmail.com", initial_capital: float = 100000.0):
    """
    Seed 100% mathematically consistent paper trading data for the given user email.
    Guarantees:
    - Initial capital = initial_capital (default ₹1,00,000)
    - Cash balance never goes negative
    - Holdings match transaction history exactly
    - Realized P&L is accurate to the cent
    - Remaining cash is ~₹10,000–₹25,000
    - Historical equity curve snapshots generated daily
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise ValueError(f"User with email '{email}' does not exist in the database.")
    
    # 1. Clear existing trading records
    clear_user_trading_data(db, user.id)
    
    current_cash = float(initial_capital)
    
    # Track holdings state: { symbol: { "quantity": int, "buy_price": float, "realized_pnl": float } }
    holdings_map = {}
    
    # For trade diary open entry tracking: { symbol: list of open diary IDs }
    open_diaries = {}
    
    # Track daily cash and holdings value for equity snapshots
    # Key: date string YYYY-MM-DD -> { cash, holdings_cost }
    daily_tracker = {}
    
    orders_created = []
    
    # 2. Process transactions chronologically
    for txn in SEED_TRANSACTIONS:
        sym = txn["symbol"]
        comp = txn["company"]
        order_type = txn["type"]
        qty = txn["qty"]
        price = txn["price"]
        ts_str = txn["timestamp"]
        dt = datetime.fromisoformat(ts_str)
        total_val = round(price * qty, 4)
        
        realized_pnl = 0.0
        
        if order_type == "BUY":
            if total_val > current_cash:
                raise ValueError(f"Transaction failed: cost ₹{total_val} exceeds cash ₹{current_cash}")
            
            current_cash -= total_val
            
            if sym not in holdings_map or holdings_map[sym]["quantity"] == 0:
                holdings_map[sym] = {
                    "quantity": qty,
                    "buy_price": price,
                    "realized_pnl": 0.0
                }
            else:
                existing_qty = holdings_map[sym]["quantity"]
                existing_price = holdings_map[sym]["buy_price"]
                new_total_qty = existing_qty + qty
                weighted_avg = ((existing_qty * existing_price) + (qty * price)) / new_total_qty
                holdings_map[sym]["quantity"] = new_total_qty
                holdings_map[sym]["buy_price"] = round(weighted_avg, 4)
                
            # Create OrderHistory
            order = OrderHistory(
                user_id=user.id,
                symbol=sym,
                order_type="BUY",
                quantity=qty,
                price=price,
                total_value=total_val,
                timestamp=dt,
                realized_pnl=0.0
            )
            db.add(order)
            orders_created.append(order)
            
            # Create TradeDiary
            diary = TradeDiary(
                user_id=user.id,
                symbol=sym,
                company_name=comp,
                status="OPEN",
                trade_type="BUY",
                quantity=qty,
                buy_price=price,
                buy_time=dt.replace(tzinfo=None),
                notes=txn.get("note"),
                rating=4,
                created_at=dt.replace(tzinfo=None)
            )
            db.add(diary)
            db.flush()
            
            if sym not in open_diaries:
                open_diaries[sym] = []
            open_diaries[sym].append(diary.id)
            
        elif order_type == "SELL":
            if sym not in holdings_map or holdings_map[sym]["quantity"] < qty:
                raise ValueError(f"Transaction failed: attempting to sell {qty} shares of {sym} when holding is insufficient.")
            
            existing_avg_buy = holdings_map[sym]["buy_price"]
            cost_basis = existing_avg_buy * qty
            realized_pnl = round(total_val - cost_basis, 2)
            
            current_cash += total_val
            holdings_map[sym]["quantity"] -= qty
            holdings_map[sym]["realized_pnl"] += realized_pnl
            
            # Create OrderHistory
            order = OrderHistory(
                user_id=user.id,
                symbol=sym,
                order_type="SELL",
                quantity=qty,
                price=price,
                total_value=total_val,
                timestamp=dt,
                realized_pnl=realized_pnl
            )
            db.add(order)
            orders_created.append(order)
            
            # Update TradeDiary
            if sym in open_diaries and open_diaries[sym]:
                diary_id = open_diaries[sym].pop(0)
                diary = db.query(TradeDiary).filter(TradeDiary.id == diary_id).first()
                if diary:
                    diary.status = "CLOSED"
                    diary.sell_price = price
                    diary.sell_time = dt.replace(tzinfo=None)
                    diary.pnl = realized_pnl
                    if diary.buy_time:
                        diff = (dt.replace(tzinfo=None) - diary.buy_time).total_seconds() / 60.0
                        diary.holding_duration_mins = round(diff, 1)
        
        # Record day-end balance for snapshot generation
        date_key = dt.strftime("%Y-%m-%d")
        current_holdings_cost = sum(
            h["quantity"] * h["buy_price"] for h in holdings_map.values() if h["quantity"] > 0
        )
        daily_tracker[date_key] = {
            "cash": round(current_cash, 2),
            "holdings_cost": round(current_holdings_cost, 2),
            "date_obj": dt.date()
        }

    # 3. Update Portfolio table
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
    portfolio.balance = round(current_cash, 4)
    
    # 4. Populate Trade table with remaining open holdings
    open_positions_count = 0
    total_invested_cost = 0.0
    for sym, h in holdings_map.items():
        if h["quantity"] > 0:
            open_positions_count += 1
            invested = h["quantity"] * h["buy_price"]
            total_invested_cost += invested
            trade = Trade(
                user_id=user.id,
                symbol=sym,
                quantity=h["quantity"],
                buy_price=round(h["buy_price"], 4),
                realized_pnl=round(h["realized_pnl"], 4)
            )
            db.add(trade)
            
    # 5. Populate PortfolioSnapshots across calendar days
    start_date = datetime.fromisoformat(SEED_TRANSACTIONS[0]["timestamp"]).date()
    end_date = datetime.now(timezone.utc).date()
    
    running_cash = float(initial_capital)
    running_cost = 0.0
    
    cur_date = start_date
    while cur_date <= end_date:
        d_str = cur_date.strftime("%Y-%m-%d")
        if d_str in daily_tracker:
            running_cash = daily_tracker[d_str]["cash"]
            running_cost = daily_tracker[d_str]["holdings_cost"]
            
        snap = PortfolioSnapshot(
            user_id=user.id,
            date=cur_date,
            cash_balance=running_cash,
            holdings_value=running_cost,
            total_value=round(running_cash + running_cost, 2)
        )
        db.add(snap)
        cur_date += timedelta(days=1)

    # 6. Seed Watchlist
    for sym in WATCHLIST_STOCKS:
        wl = Watchlist(
            user_id=user.id,
            symbol=sym,
            notes="Demo watchlist stock"
        )
        db.add(wl)

    db.commit()
    
    total_realized_pnl = sum(o.realized_pnl for o in orders_created if o.order_type == "SELL")
    
    summary = {
        "user_id": user.id,
        "email": user.email,
        "starting_capital": initial_capital,
        "final_cash_balance": round(current_cash, 2),
        "total_invested_cost": round(total_invested_cost, 2),
        "total_realized_pnl": round(total_realized_pnl, 2),
        "open_positions_count": open_positions_count,
        "total_transactions": len(SEED_TRANSACTIONS),
        "stocks_traded": list(set(t["symbol"] for t in SEED_TRANSACTIONS)),
        "open_holdings": [
            {
                "symbol": sym,
                "quantity": h["quantity"],
                "avg_buy_price": round(h["buy_price"], 2)
            }
            for sym, h in holdings_map.items() if h["quantity"] > 0
        ]
    }
    
    logger.info("Demo data seeded successfully for %s", email)
    return summary
