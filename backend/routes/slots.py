from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.database import get_db
import datetime

router = APIRouter()

class SlotRequest(BaseModel):
    customer_name: str
    vehicle_no: str
    fuel_type: str
    slot_date: str
    slot_time: str

BOOKED_SLOTS = {"2026-04-10": ["08:00","08:30","10:30"]}

@router.get("/available")
def get_available_slots(date: str):
    booked = BOOKED_SLOTS.get(date, [])
    times = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00",
             "12:30","13:00","13:30","14:00","14:30","15:00"]
    return [{"time": t, "available": t not in booked} for t in times]

@router.post("/book")
def book_slot(req: SlotRequest):
    conn = get_db()
    # Check if slot already taken
    existing = conn.execute(
        "SELECT id FROM slots WHERE slot_date=? AND slot_time=? AND status='booked'",
        (req.slot_date, req.slot_time)
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Slot already booked")

    conn.execute(
        "INSERT INTO slots (customer_name, vehicle_no, fuel_type, slot_date, slot_time, created_at) VALUES (?,?,?,?,?,?)",
        (req.customer_name, req.vehicle_no, req.fuel_type, req.slot_date, req.slot_time,
         datetime.datetime.now().isoformat())
    )
    conn.commit()
    points = 20  # bonus for advance booking
    conn.close()
    return {
        "status": "confirmed",
        "message": f"Slot booked for {req.slot_date} at {req.slot_time}",
        "fuel_points_earned": points,
        "pump_assigned": "Pump 2",
    }

@router.get("/list")
def list_slots(date: str = None):
    conn = get_db()
    if date:
        rows = conn.execute("SELECT * FROM slots WHERE slot_date=?", (date,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM slots ORDER BY slot_date, slot_time").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/queue/{vehicle_no}")
def get_queue_position(vehicle_no: str):
    return {
        "vehicle_no": vehicle_no,
        "position": 3,
        "eta_minutes": 12,
        "pump": "Pump 2",
        "status": "in_queue",
        "steps": [
            {"label":"Slot booked",             "done":True},
            {"label":"Vehicle verified (FASTag)","done":True},
            {"label":"In queue at pump",         "done":False,"current":True},
            {"label":"Fueling starts",           "done":False},
            {"label":"Auto payment & receipt",   "done":False},
        ]
    }
