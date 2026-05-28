from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TradeDiary(Base):
    __tablename__ = "trade_diary"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    symbol = Column(String, index=True)
    company_name = Column(String, nullable=True)
    status = Column(String, default="OPEN") # OPEN or CLOSED
    trade_type = Column(String, nullable=True) # BUY (long) or SELL (short)
    quantity = Column(Integer)
    buy_price = Column(Float, nullable=True)
    sell_price = Column(Float, nullable=True)
    buy_time = Column(DateTime, default=datetime.utcnow)
    sell_time = Column(DateTime, nullable=True)
    holding_duration_mins = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    emotion_tags = Column(JSON, default=list) # Array of strings
    notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True) # 1 to 5
    screenshot_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", backref="diary_entries")
