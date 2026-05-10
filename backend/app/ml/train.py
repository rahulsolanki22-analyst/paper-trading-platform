import joblib
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.utils.class_weight import compute_sample_weight

from app.ml.features import build_features
from xgboost import XGBClassifier


def _time_split(X: pd.DataFrame, y: pd.Series, train_frac: float = 0.7, val_frac: float = 0.15):
    """
    Time-based split to avoid leaking future information in time series.
    Returns X_train, X_val, X_test, y_train, y_val, y_test.
    """
    n = len(X)
    n_train = int(n * train_frac)
    n_val = int(n * val_frac)
    n_test_start = n_train + n_val

    if n_train < 10 or n_val < 5 or (n - n_test_start) < 5:
        raise ValueError(f"Not enough rows to split: n={n}")

    X_train = X.iloc[:n_train]
    y_train = y.iloc[:n_train]
    X_val = X.iloc[n_train:n_test_start]
    y_val = y.iloc[n_train:n_test_start]
    X_test = X.iloc[n_test_start:]
    y_test = y.iloc[n_test_start:]
    return X_train, X_val, X_test, y_train, y_val, y_test



def train_models(symbol="AAPL", period="2y"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    data = build_features(df)

    X = data.drop(columns=["label"])
    y = data["label"]
    print(data["label"].value_counts())

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    # Time-series split (train/val/test) to reduce leakage and calibrate probabilities.
    y_enc_s = pd.Series(y_enc, index=X.index)
    X_train, X_val, X_test, y_train, y_val, y_test = _time_split(X, y_enc_s)
    

    # Logistic Regression
    logreg = LogisticRegression(max_iter=2000, class_weight="balanced")
    logreg.fit(X_train, y_train)

    # Random Forest
    rf = RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced")
    rf.fit(X_train, y_train)

    joblib.dump(logreg, "app/ml/models/logistic.pkl")
    joblib.dump(rf, "app/ml/models/random_forest.pkl")
    joblib.dump(le, "app/ml/models/label_encoder.pkl")

    # XGBoost
    xgb = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    num_class=3,
    eval_metric="mlogloss",
    random_state=42
    )

    # Balance training via sample weights (helps even if labels drift slightly)
    sample_weight = compute_sample_weight(class_weight="balanced", y=y_train)
    xgb.fit(X_train, y_train, sample_weight=sample_weight)

    joblib.dump(xgb, "app/ml/models/xgboost.pkl")

    # Calibrate probabilities to avoid extreme 99% outputs.
    # We fit the base model on train, then calibrate on the next (validation) time slice.
    calib = CalibratedClassifierCV(xgb, method="sigmoid", cv="prefit")
    calib.fit(X_val, y_val)
    joblib.dump(calib, "app/ml/models/xgboost_calibrated.pkl")


    return {
        "logistic_accuracy": logreg.score(X_test, y_test),
        "random_forest_accuracy": rf.score(X_test, y_test),
        "xgboost_accuracy": xgb.score(X_test, y_test),
        "xgboost_calibrated_accuracy": calib.score(X_test, y_test),
    }

if __name__ == "__main__":
    print(train_models())
