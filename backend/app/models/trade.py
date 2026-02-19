from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    symbol = Column(String, index=True)
    quantity = Column(Integer)
    buy_price = Column(Float)
    stop_loss = Column(Float, nullable=True)
    realized_pnl = Column(Float, default=0.0)
    
    # Relationship
    user = relationship("User", back_populates="trades")
