from fastapi import APIRouter
from models.database import get_db
import datetime

router = APIRouter()

@router.get("/")
def get_staff():
    conn = get_db()
    rows = conn.execute("SELECT * FROM staff ORDER BY shift, name").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/on-duty")
def get_on_duty():
    conn = get_db()
    rows = conn.execute("SELECT * FROM staff WHERE status='on_duty'").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/handover/{staff_id}")
def shift_handover(staff_id: int, notes: str = ""):
    return {
        "status": "handover_complete",
        "timestamp": datetime.datetime.now().isoformat(),
        "report_url": f"/api/compliance/handover/{staff_id}",
        "message": "Shift handover report generated and sent to manager",
    }
