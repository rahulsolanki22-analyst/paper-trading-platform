from sqlalchemy import Column, Integer, Float, Boolean, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BotConfig(Base):
    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    active = Column(Boolean, default=False)
    confidence_threshold = Column(Float, default=70.0) # 0-100
    max_position_size = Column(Float, default=5000.0) # Max $ per trade
    symbols = Column(String, default="AAPL,MSFT,GOOGL,TSLA,AMZN") # Comma separated
    
    # Relationship
    user = relationship("User", back_populates="bot_config")
