from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class TradeDiaryBase(BaseModel):
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    emotion_tags: Optional[List[str]] = []
    screenshot_path: Optional[str] = None

class TradeDiaryCreate(TradeDiaryBase):
    symbol: str
    company_name: Optional[str] = None
    trade_type: str
    quantity: int
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None

class TradeDiaryUpdate(TradeDiaryBase):
    pass

class TradeDiaryResponse(TradeDiaryBase):
    id: int
    user_id: int
    symbol: str
    company_name: Optional[str]
    status: str
    trade_type: str
    quantity: int
    buy_price: Optional[float]
    sell_price: Optional[float]
    buy_time: Optional[datetime]
    sell_time: Optional[datetime]
    holding_duration_mins: Optional[float]
    pnl: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DiaryAnalyticsResponse(BaseModel):
    total_trades: int
    win_rate: float
    average_profit: float
    average_loss: float
    most_common_emotion: Optional[str]
    most_profitable_setup: Optional[str]
    fomo_trade_count: int
    average_holding_time_mins: float
