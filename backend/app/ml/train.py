import joblib
import pandas as pd
import yfinance as yf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from app.ml.features import build_features
from xgboost import XGBClassifier



def train_models(symbol="AAPL", period="2y"):
    stock = yf.Ticker(symbol)
    df = stock.history(period=period)

    data = build_features(df)

    X = data.drop(columns=["label"])
    y = data["label"]
    print(data["label"].value_counts())

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, shuffle=True
    )
    

    # Logistic Regression
    logreg = LogisticRegression(max_iter=1000)
    logreg.fit(X_train, y_train)

    # Random Forest
    rf = RandomForestClassifier(n_estimators=200, random_state=42)
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

    xgb.fit(X_train, y_train)

    joblib.dump(xgb, "app/ml/models/xgboost.pkl")


    return {
        "logistic_accuracy": logreg.score(X_test, y_test),
        "random_forest_accuracy": rf.score(X_test, y_test),
        "xgboost_accuracy": xgb.score(X_test, y_test)
    }

if __name__ == "__main__":
    print(train_models())
