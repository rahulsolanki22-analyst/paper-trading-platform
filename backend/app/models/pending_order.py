from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PendingOrder(Base):
    """Pending conditional orders (stop-loss, take-profit, trailing stop)."""
    __tablename__ = "pending_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    symbol = Column(String, index=True, nullable=False)
    order_type = Column(String, nullable=False)  # "SELL" for stop-loss/take-profit
    quantity = Column(Integer, nullable=False)
    trigger_price = Column(Numeric(precision=18, scale=4), nullable=False)
    condition = Column(String, nullable=False)  # "STOP_LOSS", "TAKE_PROFIT", "TRAILING_STOP"
    trailing_percent = Column(Numeric(precision=18, scale=4), nullable=True)  # For trailing stops
    peak_price = Column(Numeric(precision=18, scale=4), nullable=True)  # Track peak price for trailing stop
    status = Column(String, default="PENDING")  # "PENDING", "TRIGGERED", "CANCELLED"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="pending_orders")
