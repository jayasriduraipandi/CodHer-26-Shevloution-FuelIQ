import React, { useState, useEffect } from "react";

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/transactions/recent?limit=30")
      .then(r => r.json()).then(setTxns).catch(() => setTxns(MOCK_TXNS));
  }, []);

  const filtered = filter === "fraud"
    ? txns.filter(t => t.fraud_flag)
    : txns;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Transactions</div>
        <div className="page-sub">All fuel dispensing records with AI fraud scores</div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button className={`btn ${filter==="all"?"btn-primary":""}`}
          onClick={()=>setFilter("all")}>All Transactions</button>
        <button className={`btn ${filter==="fraud"?"btn-danger":""}`}
          onClick={()=>setFilter("fraud")}>
          ⚠ Fraud Alerts ({txns.filter(t=>t.fraud_flag).length})
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th><th>Fuel</th><th>Dispensed</th>
                <th>Billed</th><th>Amount</th><th>Pump</th>
                <th>Staff</th><th>Fraud Score</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t,i) => (
                <tr key={i}>
                  <td><code style={{fontFamily:"monospace",fontWeight:600}}>{t.vehicle_no}</code></td>
                  <td>{t.fuel_type}</td>
                  <td>{Number(t.litres).toFixed(1)}L</td>
                  <td>{Number(t.billed_litres).toFixed(1)}L</td>
                  <td style={{fontWeight:600}}>₹{Number(t.amount).toFixed(2)}</td>
                  <td>P{t.pump_id}</td>
                  <td style={{fontSize:11}}>{t.staff_name}</td>
                  <td>
                    <span style={{
                      fontWeight:700, fontSize:11,
                      color: t.fraud_score > 0.5 ? "#B91C1C" : t.fraud_score > 0.2 ? "#B45309" : "#0E8A5F"
                    }}>{Number(t.fraud_score).toFixed(3)}</span>
                  </td>
                  <td>
                    {t.fraud_flag
                      ? <span className="badge-red">⚠ Fraud</span>
                      : <span className="badge-green">✓ Clean</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const MOCK_TXNS = [
  {vehicle_no:"TN01AB4421",fuel_type:"Petrol",litres:13.8,billed_litres:13.8,amount:1445.14,pump_id:2,staff_name:"Karthik Sundar",fraud_flag:0,fraud_score:0.12},
  {vehicle_no:"TN22CD7890",fuel_type:"Diesel",litres:20.1,billed_litres:20.1,amount:1872.11,pump_id:1,staff_name:"Karthik Sundar",fraud_flag:0,fraud_score:0.08},
  {vehicle_no:"TN05EF1122",fuel_type:"Petrol",litres:12.4,billed_litres:10.1,amount:1058.67,pump_id:3,staff_name:"Ravi Kumar",fraud_flag:1,fraud_score:0.82},
  {vehicle_no:"TN33IJ5566",fuel_type:"Premium",litres:8.5,billed_litres:8.5,amount:992.80,pump_id:4,staff_name:"Meena D",fraud_flag:0,fraud_score:0.05},
  {vehicle_no:"TN09GH3344",fuel_type:"Diesel",litres:35.0,billed_litres:35.0,amount:3259.90,pump_id:5,staff_name:"Karthik Sundar",fraud_flag:0,fraud_score:0.07},
];
