from fastapi import APIRouter
import yfinance as yf
from app.ml.features import build_features

router = APIRouter()

@router.get("/")
def create_dataset(symbol: str = "AAPL", period: str = "1y"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    dataset = build_features(df)

    return dataset.tail(50).to_dict(orient="records")
