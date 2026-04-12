"""
FuelIQ — AI Fraud Detection Module
Uses Isolation Forest (anomaly detection) to flag
dispense-vs-billing mismatches in real time.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
import joblib, os, random

MODEL_PATH = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")

# ── Train on synthetic data if model doesn't exist ─────────────────
def _train_model():
    np.random.seed(42)
    n = 2000

    # Normal transactions: billed ~ dispensed (diff < 0.5L)
    normal_diff = np.random.uniform(0, 0.5, int(n * 0.95))
    # Fraudulent: diff between 2-5L
    fraud_diff  = np.random.uniform(2.0, 5.0, int(n * 0.05))
    diffs = np.concatenate([normal_diff, fraud_diff])

    litres  = np.random.uniform(5, 40, n)
    amounts = litres * np.random.uniform(93, 117, n)
    ratios  = diffs / litres

    X = np.column_stack([litres, diffs, ratios, amounts])

    model = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    model.fit(X)
    joblib.dump(model, MODEL_PATH)
    return model

def _load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return _train_model()

_model = None

def detect_fraud(dispensed_litres: float, billed_litres: float, fuel_type: str) -> dict:
    global _model
    if _model is None:
        _model = _load_model()

    prices = {"Petrol": 104.72, "Diesel": 93.14, "Premium": 116.80}
    price  = prices.get(fuel_type, 100.0)

    diff   = dispensed_litres - billed_litres
    ratio  = diff / max(dispensed_litres, 0.1)
    amount = billed_litres * price

    X = np.array([[dispensed_litres, diff, ratio, amount]])
    pred  = _model.predict(X)[0]          # -1 = anomaly, 1 = normal
    score = -_model.score_samples(X)[0]   # higher = more anomalous

    is_fraud = (pred == -1) or (diff > 2.0)

    return {
        "is_fraud": bool(is_fraud),
        "score":    round(float(score), 4),
        "diff_litres": round(diff, 2),
        "message":  (
            f"⚠ Fraud detected: {dispensed_litres}L dispensed but only {billed_litres}L billed. "
            f"Difference: {diff:.2f}L (₹{diff*price:.0f}). "
            f"Anomaly score: {score:.3f}"
        ) if is_fraud else "Transaction normal"
    }
