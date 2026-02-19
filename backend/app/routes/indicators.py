from fastapi import APIRouter
import yfinance as yf
import pandas as pd
from app.services.indicators import sma, ema, rsi, macd

router = APIRouter()

@router.get("/")
def get_indicators(symbol: str = "AAPL", period: str = "3mo"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    close = df["Close"]

    df["SMA_20"] = sma(close, 20)
    df["EMA_20"] = ema(close, 20)
    df["RSI_14"] = rsi(close)
    macd_line, signal_line, hist = macd(close)

    df["MACD"] = macd_line
    df["MACD_SIGNAL"] = signal_line
    df["MACD_HIST"] = hist

    df = df.dropna()
    df.reset_index(inplace=True)

    return df.tail(30).to_dict(orient="records")
