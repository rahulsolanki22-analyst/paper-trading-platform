from app.services.indicators import ema, rsi
from app.services.strategy import generate_signal

def backtest(df, initial_balance=100000):
    balance = initial_balance
    position = 0
    entry_price = 0
    trades = 0

    df["EMA_20"] = ema(df["Close"], 20)
    df["RSI_14"] = rsi(df["Close"])
    df = df.dropna()

    for _, row in df.iterrows():
        signal = generate_signal(
            rsi=row["RSI_14"],
            close=row["Close"],
            ema=row["EMA_20"]
        )

        if signal == "BUY" and position == 0:
            position = balance / row["Close"]
            entry_price = row["Close"]
            balance = 0
            trades += 1

        elif signal == "SELL" and position > 0:
            balance = position * row["Close"]
            position = 0

    if position > 0:
        balance = position * df.iloc[-1]["Close"]

    return {
        "final_balance": round(balance, 2),
        "profit": round(balance - initial_balance, 2),
        "total_trades": trades
    }
