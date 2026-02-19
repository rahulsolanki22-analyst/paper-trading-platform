from fastapi import APIRouter
import yfinance as yf
from app.services.backtesting import backtest

router = APIRouter()

@router.get("/")
def run_backtest(symbol: str = "AAPL", period: str = "6mo"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    result = backtest(df)

    return {
        "symbol": symbol,
        "period": period,
        "result": result
    }
