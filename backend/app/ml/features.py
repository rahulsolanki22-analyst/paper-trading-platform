import pandas as pd
from app.services.indicators import ema, rsi, macd


def _label_by_future_return_quantiles(
    df: pd.DataFrame,
    horizon: int = 5,
    lower_q: float = 0.33,
    upper_q: float = 0.67,
) -> pd.DataFrame:
    """
    Create BUY/HOLD/SELL labels from future returns.

    This avoids target leakage from using RSI-threshold labels (which the model can
    learn almost perfectly), and produces a roughly balanced class distribution by
    using quantiles of future returns.
    """
    if "Close" not in df.columns:
        raise ValueError("DataFrame must contain 'Close' column")

    out = df.copy()
    out["future_close"] = out["Close"].shift(-horizon)
    out["future_ret"] = (out["future_close"] / out["Close"]) - 1.0

    # Determine thresholds from the training window itself
    lo = float(out["future_ret"].quantile(lower_q))
    hi = float(out["future_ret"].quantile(upper_q))

    out["label"] = "HOLD"
    out.loc[out["future_ret"] <= lo, "label"] = "SELL"
    out.loc[out["future_ret"] >= hi, "label"] = "BUY"

    # Drop rows without a future return label (last `horizon` rows)
    out = out.dropna(subset=["future_ret"])
    return out

def build_features(df):
    close = df["Close"]

    df["EMA_20"] = ema(close, 20)
    df["RSI_14"] = rsi(close)
    macd_line, signal_line, hist = macd(close)

    df["MACD"] = macd_line
    df["MACD_SIGNAL"] = signal_line
    df["MACD_HIST"] = hist

    df = df.dropna()

    # Label creation (future-return based, quantile-balanced)
    df = _label_by_future_return_quantiles(df, horizon=5, lower_q=0.33, upper_q=0.67)


    return df[
        ["Close", "EMA_20", "RSI_14", "MACD", "MACD_SIGNAL", "MACD_HIST", "label"]
    ]
