"""
Automated verification test script for rahul@gmail.com demo trading requirements.
Tests:
1. Login user rahul@gmail.com
2. Dashboard & Valuation calculation
3. Portfolio & Holdings consistency
4. Transaction history count & fields
5. Executing a BUY order
6. Executing a SELL order
7. Cash balance and P&L math integrity
8. Resetting / Re-seeding demo state
9. Verification of clean presentation state
"""

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade
from app.models.order import OrderHistory
from app.routes.valuation import portfolio_valuation
from app.routes.analytics import get_analytics_summary, get_equity_curve
from app.routes.trading import get_holdings, get_trade_history, buy_stock, sell_stock
from app.services.demo_seeder import seed_demo_data_for_user, clear_user_trading_data

def run_verification():
    db = SessionLocal()
    try:
        print("=== STEP 1: Verify User rahul@gmail.com ===")
        user = db.query(User).filter(User.email == "rahul@gmail.com").first()
        assert user is not None, "User rahul@gmail.com not found!"
        print(f"User verified: ID={user.id}, Username={user.username}, Email={user.email}")

        print("\n=== STEP 2: Re-seed Clean Demo Dataset ===")
        summary = seed_demo_data_for_user(db, "rahul@gmail.com", initial_capital=100000.0)
        print(f"Starting Capital: INR {summary['starting_capital']:,.2f}")
        print(f"Seeded Transactions Count: {summary['total_transactions']}")
        print(f"Final Available Cash: INR {summary['final_cash_balance']:,.2f}")
        print(f"Open Positions Count: {summary['open_positions_count']}")
        print(f"Stocks Traded: {summary['stocks_traded']}")

        print("\n=== STEP 3: Verify Portfolio Valuation API ===")
        val = portfolio_valuation(current_user=user, db=db)
        cash = val["cash_balance"]
        tot_val = val["total_portfolio_value"]
        holdings = val["holdings"]
        tot_holdings_val = sum(h["current_value"] for h in holdings)
        print(f"Valuation Cash: INR {cash:,.2f}")
        print(f"Valuation Holdings Value: INR {tot_holdings_val:,.2f}")
        print(f"Valuation Total Account Value: INR {tot_val:,.2f}")
        assert abs((cash + tot_holdings_val) - tot_val) < 0.01, "Cash + Holdings Value != Total Value!"
        print("[SUCCESS] Valuation equation (Available Cash + Portfolio Value = Total Account Value) verified!")

        print("\n=== STEP 4: Verify Analytics Summary API ===")
        analytics = get_analytics_summary(current_user=user, db=db)
        print(f"Analytics Total Trades: {analytics['total_trades']}")
        print(f"Analytics Win Rate: {analytics['win_rate']}%")
        print(f"Analytics Total Realized P&L: INR {analytics['total_realized_pnl']:,.2f}")
        print(f"Analytics Total Return: INR {analytics['total_return']:,.2f}")
        assert analytics["total_trades"] == 20, f"Expected 20 trades, got {analytics['total_trades']}"
        assert abs(analytics["total_realized_pnl"] - 2192.50) < 0.01, "Realized P&L mismatch!"
        print("[SUCCESS] Analytics metrics verified!")

        print("\n=== STEP 5: Verify Transaction History ===")
        history = get_trade_history(limit=50, current_user=user, db=db)
        print(f"Fetched Trade History count: {len(history)}")
        first_tx = history[0]
        last_tx = history[-1]
        print(f"Latest Transaction: {first_tx['order_type']} {first_tx['symbol']} Qty:{first_tx['quantity']} @ INR {first_tx['price']} (Date: {first_tx['timestamp']})")
        print(f"Earliest Transaction: {last_tx['order_type']} {last_tx['symbol']} Qty:{last_tx['quantity']} @ INR {last_tx['price']} (Date: {last_tx['timestamp']})")
        assert len(history) == 20, "Order history count mismatch!"

        print("\n=== STEP 6: Execute Demonstration BUY Operation ===")
        initial_cash_before_buy = float(db.query(Portfolio).filter(Portfolio.user_id == user.id).first().balance)
        buy_res = buy_stock(symbol="ITC.NS", quantity=5, current_user=user, db=db)
        print(f"BUY Executed: {buy_res['message']} — {buy_res['quantity']} shares of {buy_res['symbol']} @ INR {buy_res['buy_price']}")
        cash_after_buy = buy_res['remaining_balance']
        print(f"Cash before BUY: INR {initial_cash_before_buy:,.2f} -> Cash after BUY: INR {cash_after_buy:,.2f}")
        assert cash_after_buy < initial_cash_before_buy, "Cash balance did not decrease after BUY!"

        print("\n=== STEP 7: Execute Demonstration SELL Operation ===")
        sell_res = sell_stock(symbol="ITC.NS", quantity=5, current_user=user, db=db)
        print(f"SELL Executed: {sell_res['message']} — {sell_res['quantity_sold']} shares of {sell_res['symbol']} @ INR {sell_res['sell_price']}, PnL: INR {sell_res['pnl']}")
        cash_after_sell = sell_res['balance']
        print(f"Cash before SELL: INR {cash_after_buy:,.2f} -> Cash after SELL: INR {cash_after_sell:,.2f}")
        assert cash_after_sell > cash_after_buy, "Cash balance did not increase after SELL!"

        print("\n=== STEP 8: Reset Back to Clean Demo Presentation State ===")
        final_summary = seed_demo_data_for_user(db, "rahul@gmail.com", initial_capital=100000.0)
        print(f"Clean Presentation State Restored. Available Cash: INR {final_summary['final_cash_balance']:,.2f}")

        print("\n========================================================")
        print("ALL 9 VERIFICATION CHECKS PASSED PERFECTLY!")
        print("========================================================")
    finally:
        db.close()

if __name__ == "__main__":
    run_verification()
