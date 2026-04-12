from fastapi import APIRouter
from models.database import get_db
import datetime

router = APIRouter()

@router.get("/")
def get_alerts(resolved: bool = False):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM alerts WHERE resolved=? ORDER BY created_at DESC",
        (1 if resolved else 0,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/resolve/{alert_id}")
def resolve_alert(alert_id: int):
    conn = get_db()
    conn.execute("UPDATE alerts SET resolved=1 WHERE id=?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "resolved"}

@router.post("/create")
def create_alert(alert_type: str, severity: str, message: str):
    conn = get_db()
    conn.execute(
        "INSERT INTO alerts (alert_type, severity, message, created_at) VALUES (?,?,?,?)",
        (alert_type, severity, message, datetime.datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "created"}
