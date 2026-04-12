"""
FuelIQ — Demand Forecasting Module
Time-series regression to predict daily fuel demand
and trigger reorder alerts at 40% tank level.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
import datetime

def generate_synthetic_history(days: int = 90):
    """90-day synthetic demand data"""
    np.random.seed(7)
    data = []
    base = datetime.date.today() - datetime.timedelta(days=days)
    for i in range(days):
        d = base + datetime.timedelta(days=i)
        is_weekend = d.weekday() >= 5
        # Weekends ~20% higher demand
        petrol  = round(np.random.normal(3800 if is_weekend else 3200, 300), 0)
        diesel  = round(np.random.normal(2200 if is_weekend else 1800, 200), 0)
        premium = round(np.random.normal(900  if is_weekend else 700,  100), 0)
        data.append({
            "date": d.isoformat(),
            "day_of_week": d.weekday(),
            "is_weekend": int(is_weekend),
            "petrol_litres": max(0, petrol),
            "diesel_litres": max(0, diesel),
            "premium_litres": max(0, premium),
        })
    return data

def forecast_demand(days_ahead: int = 7):
    history = generate_synthetic_history()

    X = np.array([[h["day_of_week"], h["is_weekend"]] for h in history])
    y_petrol  = np.array([h["petrol_litres"]  for h in history])
    y_diesel  = np.array([h["diesel_litres"]  for h in history])
    y_premium = np.array([h["premium_litres"] for h in history])

    models = {}
    for label, y in [("petrol", y_petrol), ("diesel", y_diesel), ("premium", y_premium)]:
        m = LinearRegression()
        m.fit(X, y)
        models[label] = m

    forecasts = []
    today = datetime.date.today()
    for i in range(1, days_ahead + 1):
        d = today + datetime.timedelta(days=i)
        is_weekend = int(d.weekday() >= 5)
        xf = np.array([[d.weekday(), is_weekend]])
        forecasts.append({
            "date":    d.isoformat(),
            "day":     d.strftime("%A"),
            "petrol":  round(max(0, models["petrol"].predict(xf)[0]),  0),
            "diesel":  round(max(0, models["diesel"].predict(xf)[0]),  0),
            "premium": round(max(0, models["premium"].predict(xf)[0]), 0),
        })
    return forecasts

def check_reorder_needed(current_litres: dict, daily_demand: dict) -> list:
    """Flag tanks that need reorder within 48 hours"""
    alerts = []
    for fuel, litres in current_litres.items():
        demand = daily_demand.get(fuel, 3000)
        hours_remaining = (litres / demand) * 24
        pct = (litres / {"petrol": 21000, "diesel": 21000, "premium": 10000}.get(fuel, 21000)) * 100
        if pct < 40:
            alerts.append({
                "fuel": fuel,
                "current_litres": litres,
                "pct": round(pct, 1),
                "hours_remaining": round(hours_remaining, 1),
                "action": "Place reorder immediately",
            })
    return alerts

# ── Expose via FastAPI router ────────────────────────────────────────
from fastapi import APIRouter
router = APIRouter()

@router.get("/forecast")
def get_forecast(days: int = 7):
    return forecast_demand(days_ahead=days)

@router.get("/reorder-check")
def reorder_check():
    current = {"petrol": 18400, "diesel": 9100, "premium": 6200}
    demand  = {"petrol": 3200,  "diesel": 1800,  "premium": 700}
    return check_reorder_needed(current, demand)

@router.get("/history")
def get_history(days: int = 30):
    return generate_synthetic_history(days)[-days:]
