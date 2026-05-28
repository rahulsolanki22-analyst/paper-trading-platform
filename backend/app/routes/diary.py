from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import List, Optional
import os
import uuid
import shutil
from datetime import datetime

from app.models.user import User
from app.models.diary import TradeDiary
from app.schemas.diary import TradeDiaryCreate, TradeDiaryUpdate, TradeDiaryResponse, DiaryAnalyticsResponse
from app.utils.auth import get_db, get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/trades", response_model=List[TradeDiaryResponse])
def get_diary_trades(
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's diary trades with optional filters."""
    query = db.query(TradeDiary).filter(TradeDiary.user_id == current_user.id)
    
    if symbol:
        query = query.filter(TradeDiary.symbol.ilike(f"%{symbol}%"))
    if status:
        query = query.filter(TradeDiary.status == status.upper())
        
    trades = query.order_by(desc(TradeDiary.created_at)).limit(limit).all()
    return trades

@router.post("/trade", response_model=TradeDiaryResponse)
def create_diary_trade(
    trade: TradeDiaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually create a new diary trade."""
    new_trade = TradeDiary(
        user_id=current_user.id,
        symbol=trade.symbol.upper(),
        company_name=trade.company_name,
        trade_type=trade.trade_type.upper(),
        status="CLOSED" if trade.sell_price else "OPEN",
        quantity=trade.quantity,
        buy_price=trade.buy_price,
        sell_price=trade.sell_price,
        pnl=None, # Will calculate if both prices exist
        notes=trade.notes,
        rating=trade.rating,
        emotion_tags=trade.emotion_tags,
        screenshot_path=trade.screenshot_path
    )
    
    if new_trade.buy_price and new_trade.sell_price:
        new_trade.pnl = (new_trade.sell_price - new_trade.buy_price) * new_trade.quantity
        if new_trade.trade_type == "SELL": # Short selling
            new_trade.pnl = -new_trade.pnl
            
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade

@router.put("/trade/{trade_id}", response_model=TradeDiaryResponse)
def update_diary_trade(
    trade_id: int,
    trade_update: TradeDiaryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a diary trade (notes, rating, tags, etc)."""
    trade = db.query(TradeDiary).filter(
        TradeDiary.id == trade_id, 
        TradeDiary.user_id == current_user.id
    ).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
        
    update_data = trade_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(trade, key, value)
        
    db.commit()
    db.refresh(trade)
    return trade

@router.delete("/trade/{trade_id}")
def delete_diary_trade(
    trade_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a diary trade."""
    trade = db.query(TradeDiary).filter(
        TradeDiary.id == trade_id, 
        TradeDiary.user_id == current_user.id
    ).first()
    
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
        
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted successfully"}

@router.get("/analytics", response_model=DiaryAnalyticsResponse)
def get_diary_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate analytics for the user's closed trades."""
    closed_trades = db.query(TradeDiary).filter(
        TradeDiary.user_id == current_user.id,
        TradeDiary.status == "CLOSED",
        TradeDiary.pnl.isnot(None)
    ).all()
    
    total = len(closed_trades)
    if total == 0:
        return DiaryAnalyticsResponse(
            total_trades=0, win_rate=0, average_profit=0, average_loss=0,
            most_common_emotion=None, most_profitable_setup=None, fomo_trade_count=0, average_holding_time_mins=0
        )
        
    wins = [t for t in closed_trades if t.pnl > 0]
    losses = [t for t in closed_trades if t.pnl <= 0]
    
    win_rate = (len(wins) / total) * 100
    avg_profit = sum(t.pnl for t in wins) / len(wins) if wins else 0
    avg_loss = sum(t.pnl for t in losses) / len(losses) if losses else 0
    
    # Emotions tally
    emotions = {}
    fomo_count = 0
    for t in closed_trades:
        if t.emotion_tags:
            for tag in t.emotion_tags:
                emotions[tag] = emotions.get(tag, 0) + 1
                if tag.upper() == "FOMO":
                    fomo_count += 1
                    
    most_common_emotion = max(emotions, key=emotions.get) if emotions else None
    
    # Holding time
    holding_times = [t.holding_duration_mins for t in closed_trades if t.holding_duration_mins is not None]
    avg_holding = sum(holding_times) / len(holding_times) if holding_times else 0

    return DiaryAnalyticsResponse(
        total_trades=total,
        win_rate=round(win_rate, 2),
        average_profit=round(avg_profit, 2),
        average_loss=round(avg_loss, 2),
        most_common_emotion=most_common_emotion,
        most_profitable_setup=None, # Future AI analysis
        fomo_trade_count=fomo_count,
        average_holding_time_mins=round(avg_holding, 2)
    )

@router.post("/upload")
async def upload_screenshot(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a screenshot for a trade diary."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"path": f"/uploads/{unique_filename}"}
