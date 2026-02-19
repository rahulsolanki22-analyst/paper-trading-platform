from fastapi import APIRouter
import yfinance as yf
from app.services.indicators import ema, rsi
from app.services.strategy import generate_signal

router = APIRouter()

@router.get("/")
def get_signal(symbol: str = "AAPL", period: str = "3mo"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    close = df["Close"]

    df["EMA_20"] = ema(close, 20)
    df["RSI_14"] = rsi(close)

    df = df.dropna()

    last = df.iloc[-1]

    signal = generate_signal(
        rsi=last["RSI_14"],
        close=last["Close"],
        ema=last["EMA_20"]
    )

    return {
        "symbol": symbol,
        "price": round(last["Close"], 2),
        "rsi": round(last["RSI_14"], 2),
        "ema_20": round(last["EMA_20"], 2),
        "signal": signal
    }
