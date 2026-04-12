from fastapi import APIRouter
from pydantic import BaseModel
from models.database import get_db
from ml.fraud_detection import detect_fraud
import datetime

router = APIRouter()

class TransactionIn(BaseModel):
    vehicle_no: str
    fuel_type: str
    litres: float
    billed_litres: float
    pump_id: int
    staff_name: str

PRICES = {"Petrol": 104.72, "Diesel": 93.14, "Premium": 116.80}

@router.post("/record")
def record_transaction(txn: TransactionIn):
    amount = round(txn.billed_litres * PRICES.get(txn.fuel_type, 100), 2)
    fraud_result = detect_fraud(txn.litres, txn.billed_litres, txn.fuel_type)

    conn = get_db()
    conn.execute("""
        INSERT INTO transactions
        (vehicle_no, fuel_type, litres, billed_litres, amount, pump_id, staff_name, fraud_flag, fraud_score, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (txn.vehicle_no, txn.fuel_type, txn.litres, txn.billed_litres,
         amount, txn.pump_id, txn.staff_name,
         1 if fraud_result["is_fraud"] else 0,
         fraud_result["score"],
         datetime.datetime.now().isoformat())
    )
    conn.commit()
    points = int(txn.billed_litres * 4)  # 4 pts per litre
    conn.close()

    return {
        "status": "recorded",
        "amount": amount,
        "fuel_points": points,
        "fraud_alert": fraud_result["is_fraud"],
        "fraud_score": fraud_result["score"],
        "message": fraud_result["message"] if fraud_result["is_fraud"] else "Transaction clean",
    }

@router.get("/recent")
def recent_transactions(limit: int = 20):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/summary")
def transaction_summary():
    conn = get_db()
    today = datetime.date.today().isoformat()
    row = conn.execute("""
        SELECT
            COUNT(*) as total_txns,
            ROUND(SUM(amount),2) as total_revenue,
            ROUND(SUM(litres),1) as total_litres,
            SUM(fraud_flag) as fraud_count
        FROM transactions
        WHERE date(created_at) = ?
    """, (today,)).fetchone()
    conn.close()
    return dict(row) if row else {}

@router.get("/fraud-alerts")
def get_fraud_alerts():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM transactions WHERE fraud_flag=1 ORDER BY created_at DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
