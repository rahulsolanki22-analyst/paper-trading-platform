from fastapi import APIRouter
from app.ml.predict import predict_signal
from functools import lru_cache
from datetime import datetime, timedelta

router = APIRouter()

# Simple in-memory cache with TTL (5 minutes)
_cache = {}
_cache_ttl = timedelta(minutes=5)

@router.get("/signal")
def ml_signal(symbol: str = "AAPL"):
    """
    Get ML signal with confidence scores for BUY, HOLD, SELL.
    Cached for 5 minutes per symbol.
    """
    cache_key = f"{symbol}"
    now = datetime.now()
    
    # Check cache
    if cache_key in _cache:
        cached_data, cached_time = _cache[cache_key]
        if now - cached_time < _cache_ttl:
            return cached_data
    
    # Fetch new data
    result = predict_signal(symbol)
    _cache[cache_key] = (result, now)
    
    return result

# Legacy endpoint for backward compatibility
@router.get("/")
def ml_signal_legacy(symbol: str = "AAPL"):
    return ml_signal(symbol)
