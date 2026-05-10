import joblib
import pandas as pd
from app.services.indicators import ema, rsi, macd
from app.services.market_data import fetch_stock_data
import logging

logger = logging.getLogger(__name__)

# Load models once
try:
    logreg = joblib.load("app/ml/models/logistic.pkl")
    rf = joblib.load("app/ml/models/random_forest.pkl")
    xgb = joblib.load("app/ml/models/xgboost.pkl")
    # Optional calibrated model (reduces extreme 0/1 confidence)
    try:
        xgb_calibrated = joblib.load("app/ml/models/xgboost_calibrated.pkl")
    except Exception:
        xgb_calibrated = None
    le = joblib.load("app/ml/models/label_encoder.pkl")
except Exception as e:
    logger.error(f"Error loading ML models: {str(e)}")
    logreg = rf = xgb = xgb_calibrated = le = None

def build_latest_features(symbol="AAPL", period="3mo"):
    # Use robust market data service
    df = fetch_stock_data(symbol, period=period, interval="1d")
    
    if df is None or df.empty:
        raise ValueError(f"Unable to fetch data for {symbol}")

    close = df["Close"]

    df["EMA_20"] = ema(close, 20)
    df["RSI_14"] = rsi(close)
    macd_line, signal_line, hist = macd(close)

    df["MACD"] = macd_line
    df["MACD_SIGNAL"] = signal_line
    df["MACD_HIST"] = hist

    df = df.dropna()

    latest = df.iloc[-1]

    X = pd.DataFrame([[
        latest["Close"],
        latest["EMA_20"],
        latest["RSI_14"],
        latest["MACD"],
        latest["MACD_SIGNAL"],
        latest["MACD_HIST"]
    ]], columns=[
        "Close", "EMA_20", "RSI_14",
        "MACD", "MACD_SIGNAL", "MACD_HIST"
    ])

    return X, latest["Close"]

def predict_signal(symbol="AAPL"):
    """
    Returns ML signal with confidence scores for BUY, HOLD, SELL.
    Uses XGBoost model predictions.
    """
    X, price = build_latest_features(symbol)

    model = xgb_calibrated or xgb
    if model is None or le is None:
        raise ValueError("ML models are not loaded. Train models first.")

    # Get prediction probabilities (prefer calibrated probabilities if available)
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    
    # Get class names from label encoder
    classes = le.classes_
    
    # Map probabilities to BUY, HOLD, SELL
    confidence_map = {}
    for i, class_name in enumerate(classes):
        class_name_upper = str(class_name).upper()
        confidence_map[class_name_upper] = round(float(proba[i]) * 100, 2)
    
    # Ensure all three signals exist (default to 0 if not in model)
    buy_confidence = confidence_map.get("BUY", 0.0)
    hold_confidence = confidence_map.get("HOLD", 0.0)
    sell_confidence = confidence_map.get("SELL", 0.0)
    
    # Determine dominant signal
    label = le.inverse_transform([pred])[0]
    dominant_signal = str(label).upper()
    
    return {
        "symbol": str(symbol),
        "price": float(round(price, 2)),
        "buy_confidence": buy_confidence,
        "hold_confidence": hold_confidence,
        "sell_confidence": sell_confidence,
        "dominant_signal": dominant_signal,
        # Legacy fields for backward compatibility
        "signal": dominant_signal,
        "confidence_percent": max(buy_confidence, hold_confidence, sell_confidence)
    }

