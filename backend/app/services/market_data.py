"""
Robust market data service with retries and error handling for Yahoo Finance.
"""
import yfinance as yf
import pandas as pd
import time
from typing import Optional, Dict, List
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Cache for recent data (5 minutes)
_data_cache = {}
_cache_ttl = 300  # 5 minutes

def _get_cached_data(cache_key: str):
    """Get cached data if still valid."""
    if cache_key in _data_cache:
        data, timestamp = _data_cache[cache_key]
        if time.time() - timestamp < _cache_ttl:
            return data
        del _data_cache[cache_key]
    return None

def _set_cached_data(cache_key: str, data):
    """Cache data with timestamp."""
    _data_cache[cache_key] = (data, time.time())

def fetch_stock_data(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d",
    max_retries: int = 3,
    retry_delay: float = 1.0
) -> Optional[pd.DataFrame]:
    """
    Fetch stock data with retries and error handling.
    
    Args:
        symbol: Stock symbol
        period: Period to fetch (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval: Interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        DataFrame with stock data or None if all retries fail
    """
    cache_key = f"{symbol}_{period}_{interval}"
    cached = _get_cached_data(cache_key)
    if cached is not None:
        return cached.copy()
    
    for attempt in range(max_retries):
        try:
            # Use yfinance with session for better reliability
            ticker = yf.Ticker(symbol)
            
            # Try to get data
            if interval in ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"]:
                # Intraday data - use shorter period
                if period not in ["1d", "5d"]:
                    period = "5d"
                hist = ticker.history(period=period, interval=interval, timeout=10)
            else:
                # Daily/weekly data
                hist = ticker.history(period=period, interval=interval, timeout=10)
            
            if hist.empty:
                logger.warning(f"Empty data for {symbol}, attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                return None
            
            # Cache the result
            _set_cached_data(cache_key, hist.copy())
            return hist.copy()
            
        except Exception as e:
            logger.error(f"Error fetching {symbol} (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
            else:
                return None
    
    return None

def get_live_price(symbol: str, max_retries: int = 3) -> float:
    """
    Get live price with retries.
    
    Returns:
        Current price or 0.0 if unavailable
    """
    for attempt in range(max_retries):
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="1d", interval="1m", timeout=10)
            
            if not hist.empty:
                return float(hist["Close"].iloc[-1])
            
            # Fallback to info if history fails
            info = ticker.info
            price = info.get("regularMarketPrice") or info.get("currentPrice")
            if price:
                return float(price)
                
        except Exception as e:
            logger.warning(f"Error getting price for {symbol} (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1.0 * (attempt + 1))
    
    return 0.0

def get_stock_info(symbol: str, max_retries: int = 2) -> Optional[Dict]:
    """
    Get stock info with retries.
    
    Returns:
        Dictionary with stock info or None
    """
    for attempt in range(max_retries):
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            if info and len(info) > 0:
                return info
        except Exception as e:
            logger.warning(f"Error getting info for {symbol} (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1.0 * (attempt + 1))
    
    return None

