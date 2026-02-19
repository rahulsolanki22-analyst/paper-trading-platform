from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PortfolioSnapshot(Base):
    """Daily snapshot of portfolio value for equity curve tracking."""
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    total_value = Column(Float, nullable=False)
    cash_balance = Column(Float, nullable=False)
    holdings_value = Column(Float, default=0.0)
    
    # Relationship
    user = relationship("User", back_populates="portfolio_snapshots")
