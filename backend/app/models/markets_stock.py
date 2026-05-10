from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MarketsStock(Base):
    """
    User-customized stock list for the Markets page grid (NOT the Trading watchlist).
    """

    __tablename__ = "markets_stocks"
    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_markets_stocks_user_symbol"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    symbol = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="markets_stocks")

