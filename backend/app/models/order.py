from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    symbol = Column(String, index=True)
    order_type = Column(String)  # "BUY" or "SELL"
    quantity = Column(Integer)
    price = Column(Float)
    total_value = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    realized_pnl = Column(Float, default=0.0)  # For sell orders
    
    # Relationship
    user = relationship("User", back_populates="orders")

