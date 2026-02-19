from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.trade import Trade
from app.models.order import OrderHistory
from app.utils.auth import get_db, get_current_user

router = APIRouter()

@router.post("/portfolio/reset")
def reset_portfolio(
    initial_balance: float = 100000,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset current user's portfolio."""
    # Clear user's trades
    db.query(Trade).filter(Trade.user_id == current_user.id).delete()
    
    # Clear user's order history
    db.query(OrderHistory).filter(OrderHistory.user_id == current_user.id).delete()

    # Get or create user's portfolio
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio:
        portfolio = Portfolio(user_id=current_user.id, balance=initial_balance)
        db.add(portfolio)
    else:
        portfolio.balance = initial_balance

    db.commit()

    return {
        "message": "Paper trading reset",
        "balance": initial_balance
    }
