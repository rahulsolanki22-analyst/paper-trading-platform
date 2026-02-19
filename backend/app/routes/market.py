from fastapi import APIRouter, HTTPException
import pandas as pd
from app.services.indicators import sma, ema, rsi, macd
from app.services.market_data import fetch_stock_data
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Map frontend timeframes to yfinance intervals and periods
TIMEFRAME_MAP = {
    "1m": {"interval": "1m", "period": "1d"},
    "5m": {"interval": "5m", "period": "5d"},
    "15m": {"interval": "15m", "period": "60d"},
    "1h": {"interval": "1h", "period": "730d"},
    "1d": {"interval": "1d", "period": "1y"},
    "1w": {"interval": "1wk", "period": "5y"},
}

def calculate_vwap(df):
    """Calculate Volume Weighted Average Price"""
    typical_price = (df["High"] + df["Low"] + df["Close"]) / 3
    vwap = (typical_price * df["Volume"]).cumsum() / df["Volume"].cumsum()
    return vwap

@router.get("/candles")
def get_candles(symbol: str = "AAPL", interval: str = "1d", period: str = None):
    """
    Get candlestick data with optional indicators.
    interval: 1m, 5m, 15m, 1h, 1d, 1w
    """
    # Map timeframe if provided as timeframe instead of interval
    if interval in TIMEFRAME_MAP:
        config = TIMEFRAME_MAP[interval]
        interval = config["interval"]
        if period is None:
            period = config["period"]
    
    # Use robust market data service
    df = fetch_stock_data(symbol, period=period or "1mo", interval=interval)
    
    if df is None or df.empty:
        logger.error(f"Failed to fetch data for {symbol}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch market data for {symbol}. Please try again later or check if the symbol is valid."
        )

    df.reset_index(inplace=True)
    
    # Ensure Date column exists
    if "Date" not in df.columns and "Datetime" in df.columns:
        df["Date"] = df["Datetime"]

    candles = []
    for _, row in df.iterrows():
        # Format time for lightweight-charts
        time_val = row["Date"]
        if isinstance(time_val, pd.Timestamp):
            # For intraday, use timestamp; for daily, use date string
            if interval in ["1m", "5m", "15m", "1h"]:
                time_str = int(time_val.timestamp())
            else:
                time_str = time_val.strftime("%Y-%m-%d")
        else:
            time_str = str(time_val)

        candles.append({
            "time": time_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]) if "Volume" in row else 0
        })

    return {
        "symbol": symbol,
        "candles": candles,
        "interval": interval
    }

@router.get("/indicators")
def get_indicators_data(
    symbol: str = "AAPL",
    interval: str = "1d",
    period: str = None,
    indicators: str = None  # Comma-separated: sma,ema,rsi,macd,vwap
):
    """
    Get indicator data for chart overlay.
    """
    # Map timeframe
    if interval in TIMEFRAME_MAP:
        config = TIMEFRAME_MAP[interval]
        interval = config["interval"]
        if period is None:
            period = config["period"]
    
    # Use robust market data service
    df = fetch_stock_data(symbol, period=period or "1mo", interval=interval)
    
    if df is None or df.empty:
        logger.warning(f"Failed to fetch indicators for {symbol}")
        return {"symbol": symbol, "indicators": {}}

    df.reset_index(inplace=True)
    
    if "Date" not in df.columns and "Datetime" in df.columns:
        df["Date"] = df["Datetime"]

    close = df["Close"]
    result = {}

    requested_indicators = indicators.split(",") if indicators else []

    if "sma" in requested_indicators or not indicators:
        result["sma_20"] = sma(close, 20).fillna(0).tolist()
        result["sma_50"] = sma(close, 50).fillna(0).tolist()

    if "ema" in requested_indicators or not indicators:
        result["ema_20"] = ema(close, 20).fillna(0).tolist()
        result["ema_50"] = ema(close, 50).fillna(0).tolist()

    if "rsi" in requested_indicators or not indicators:
        result["rsi"] = rsi(close).fillna(50).tolist()

    if "macd" in requested_indicators or not indicators:
        macd_line, signal_line, hist = macd(close)
        result["macd"] = macd_line.fillna(0).tolist()
        result["macd_signal"] = signal_line.fillna(0).tolist()
        result["macd_hist"] = hist.fillna(0).tolist()

    if "vwap" in requested_indicators or not indicators:
        result["vwap"] = calculate_vwap(df).fillna(0).tolist()

    # Add timestamps
    times = []
    for _, row in df.iterrows():
        time_val = row.get("Date", row.get("Datetime"))
        if isinstance(time_val, pd.Timestamp):
            if interval in ["1m", "5m", "15m", "1h"]:
                times.append(int(time_val.timestamp()))
            else:
                times.append(time_val.strftime("%Y-%m-%d"))
        else:
            times.append(str(time_val))

    result["time"] = times
    result["close"] = close.fillna(0).tolist()

    return {
        "symbol": symbol,
        "indicators": result
    }
