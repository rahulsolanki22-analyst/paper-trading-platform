def generate_signal(rsi, close, ema):
    if rsi < 40:
        return "BUY"
    elif rsi > 60:
        return "SELL"
    else:
        return "HOLD"
