from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.demo_seeder import clear_user_trading_data, seed_demo_data_for_user
from app.utils.auth import get_db, get_current_user

router = APIRouter()

@router.post("/portfolio/reset")
def reset_portfolio(
    initial_balance: float = 100000,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset current user's portfolio to blank slate with initial balance."""
    clear_user_trading_data(db, current_user.id)
    return {
        "message": "Paper trading account reset successfully",
        "balance": initial_balance
    }

@router.post("/portfolio/seed-demo")
def seed_demo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Re-seed realistic paper trading demo dataset for current user."""
    summary = seed_demo_data_for_user(db, current_user.email)
    return {
        "message": "Demo trading data seeded successfully",
        "summary": summary
    }
