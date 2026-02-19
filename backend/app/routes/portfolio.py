from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.portfolio import Portfolio
from app.utils.auth import get_db, get_current_user

router = APIRouter()

@router.get("/")
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's portfolio balance."""
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

    if not portfolio:
        # Create portfolio if it doesn't exist
        portfolio = Portfolio(user_id=current_user.id, balance=100000.0)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)

    return {
        "balance": portfolio.balance
    }
