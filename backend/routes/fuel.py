from fastapi import APIRouter
from models.database import get_db
import datetime, random

router = APIRouter()

@router.get("/levels")
def get_fuel_levels():
    conn = get_db()
    rows = conn.execute(
        "SELECT fuel_type, level_pct, litres, recorded_at FROM fuel_levels ORDER BY id DESC LIMIT 3"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/history")
def get_fuel_history():
    """7-day revenue history for chart"""
    days = []
    for i in range(6, -1, -1):
        d = datetime.date.today() - datetime.timedelta(days=i)
        days.append({
            "date": d.strftime("%a"),
            "revenue": round(random.uniform(150000, 300000), 0),
            "litres":  round(random.uniform(1500, 4000), 0),
        })
    days[-1]["today"] = True
    return days

@router.post("/update")
def update_fuel_level(fuel_type: str, level_pct: float, litres: float):
    conn = get_db()
    conn.execute(
        "INSERT INTO fuel_levels (fuel_type, level_pct, litres, recorded_at) VALUES (?,?,?,?)",
        (fuel_type, level_pct, litres, datetime.datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "updated"}

@router.get("/pumps")
def get_pump_status():
    pumps = [
        {"id":1,"status":"active","fuel":"Petrol","health":98},
        {"id":2,"status":"active","fuel":"Diesel","health":95},
        {"id":3,"status":"alert", "fuel":"Petrol","health":72},
        {"id":4,"status":"idle",  "fuel":"Premium","health":99},
        {"id":5,"status":"active","fuel":"Diesel","health":91},
        {"id":6,"status":"maintenance","fuel":"Petrol","health":45},
    ]
    return pumps
