from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from models.database import get_db
import datetime, io

router = APIRouter()

@router.get("/report")
def generate_compliance_report():
    conn = get_db()
    txns = conn.execute(
        "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    alerts = conn.execute(
        "SELECT * FROM alerts ORDER BY created_at DESC"
    ).fetchall()
    conn.close()

    now = datetime.datetime.now()
    lines = []
    lines.append("=" * 65)
    lines.append("          FUELIQ — MONTHLY COMPLIANCE REPORT")
    lines.append("         PESO / PCO Audit Format — Confidential")
    lines.append("=" * 65)
    lines.append(f"Station  : Lakshmi Fuel Station, Anna Salai, Chennai")
    lines.append(f"Dealer   : HP Authorized Dealer")
    lines.append(f"Period   : {now.strftime('%B %Y')}")
    lines.append(f"Generated: {now.strftime('%d-%m-%Y %H:%M:%S')}")
    lines.append("-" * 65)
    lines.append("")
    lines.append("SECTION 1 — FUEL DISPENSING LOG")
    lines.append(f"{'Date':<20} {'Vehicle':<14} {'Fuel':<10} {'Litres':>8} {'Amount':>10} {'Pump':>5}")
    lines.append("-" * 65)

    total_rev = 0
    for t in txns:
        lines.append(
            f"{str(t['created_at'])[:16]:<20} {str(t['vehicle_no']):<14} "
            f"{str(t['fuel_type']):<10} {float(t['litres'] or 0):>8.1f} "
            f"{float(t['amount'] or 0):>10.2f} {int(t['pump_id'] or 0):>5}"
        )
        total_rev += float(t['amount'] or 0)

    lines.append("-" * 65)
    lines.append(f"{'TOTAL REVENUE':>55} {total_rev:>10.2f}")
    lines.append("")
    lines.append("SECTION 2 — FRAUD & ANOMALY LOG")

    fraud_txns = [t for t in txns if t['fraud_flag']]
    if fraud_txns:
        for f in fraud_txns:
            lines.append(
                f"  [FRAUD] {str(f['created_at'])[:16]} | "
                f"Pump {f['pump_id']} | {f['vehicle_no']} | "
                f"Score: {float(f['fraud_score'] or 0):.3f}"
            )
    else:
        lines.append("  No anomalies detected this period.")

    lines.append("")
    lines.append("SECTION 3 — ALERT SUMMARY")
    for a in alerts:
        lines.append(
            f"  [{str(a['severity']).upper():8}] "
            f"{str(a['created_at'])[:16]} — {a['message']}"
        )

    lines.append("")
    lines.append("=" * 65)
    lines.append("  Certified by FuelIQ Compliance Engine v1.0")
    lines.append("  This report is auto-generated for regulatory submission.")
    lines.append("=" * 65)

    content = "\n".join(lines)
    filename = f"FuelIQ_Compliance_{now.strftime('%Y%m')}.txt"

    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )

@router.get("/summary")
def compliance_summary():
    conn = get_db()
    txn_count  = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    fraud_count= conn.execute("SELECT COUNT(*) FROM transactions WHERE fraud_flag=1").fetchone()[0]
    alert_count= conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
    conn.close()
    return {
        "total_transactions": txn_count,
        "fraud_incidents":    fraud_count,
        "alerts_raised":      alert_count,
        "compliance_score":   round((1 - fraud_count / max(txn_count,1)) * 100, 1),
        "report_format":      "PESO/PCO",
        "period":             datetime.datetime.now().strftime("%B %Y"),
    }