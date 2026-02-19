import pandas as pd
from app.services.indicators import ema, rsi, macd
from app.services.strategy import generate_signal

def build_features(df):
    close = df["Close"]

    df["EMA_20"] = ema(close, 20)
    df["RSI_14"] = rsi(close)
    macd_line, signal_line, hist = macd(close)

    df["MACD"] = macd_line
    df["MACD_SIGNAL"] = signal_line
    df["MACD_HIST"] = hist

    df = df.dropna()

    # Label creation
    df = df.copy()
    df.loc[:, "label"] = df.apply(
        lambda row: generate_signal(
            rsi=row["RSI_14"],
            close=row["Close"],
            ema=row["EMA_20"]
        ),
        axis=1
    )


    return df[
        ["Close", "EMA_20", "RSI_14", "MACD", "MACD_SIGNAL", "MACD_HIST", "label"]
    ]
