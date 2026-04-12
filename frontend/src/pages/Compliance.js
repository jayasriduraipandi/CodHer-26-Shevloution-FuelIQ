import React, { useState, useEffect } from "react";

export default function Compliance() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/compliance/summary")
      .then(r => r.json()).then(setSummary).catch(() => setSummary(MOCK_SUMMARY));
  }, []);

const downloadReport = async () => {
  try {
    const response = await fetch("/api/compliance/report");
    
    if (!response.ok) throw new Error("Download failed");
    
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    
    a.href     = url;
    a.download = `FuelIQ_Compliance_${new Date().toISOString().slice(0,7)}.txt`;
    
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error("Download error:", error);
    alert("Download failed. Make sure backend is running on port 8000.");
  }
};

  const s = summary || MOCK_SUMMARY;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Compliance Report</div>
        <div className="page-sub">Auto-generated PESO / PCO audit format · {s.period}</div>
      </div>

      {/* Summary cards */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Total Transactions</div>
          <div className="kpi-value">{s.total_transactions}</div>
          <div className="kpi-delta up">This period</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Fraud Incidents</div>
          <div className="kpi-value" style={{ color: s.fraud_incidents > 0 ? "#B91C1C" : "#0E8A5F" }}>
            {s.fraud_incidents}
          </div>
          <div className={`kpi-delta ${s.fraud_incidents > 0 ? "down" : "up"}`}>
            {s.fraud_incidents > 0 ? "Under investigation" : "All clean"}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Compliance Score</div>
          <div className="kpi-value" style={{ color: "#0E8A5F" }}>{s.compliance_score}%</div>
          <div className="kpi-delta up">PESO standard</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Report Format</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>{s.report_format}</div>
          <div className="kpi-delta up">Audit-ready</div>
        </div>
      </div>

      {/* What is logged */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-title">What Gets Logged Automatically</div>
          {[
            { icon:"⛽", label:"Every dispense event",    desc:"Vehicle, fuel type, litres, timestamp, pump ID" },
            { icon:"💳", label:"Every billing entry",     desc:"Amount, payment mode, staff name, billed litres" },
            { icon:"⚠️", label:"All fraud flags",        desc:"AI score, diff in litres, CCTV clip reference" },
            { icon:"📊", label:"Tank level readings",    desc:"Sensor value every 3 minutes via IoT MQTT" },
            { icon:"👥", label:"Shift handover records", desc:"Start/end time, staff name, vehicle count, notes" },
            { icon:"🚨", label:"All system alerts",      desc:"Low stock, pump warning, anomaly detection events" },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"8px 0",
              borderBottom: i < 5 ? "1px solid #F0F4F1" : "none" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#1A2E25" }}>{item.label}</div>
                <div style={{ fontSize:10, color:"#7A8E84", marginTop:2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Regulatory Standards Covered</div>
          {[
            { body:"PESO",   full:"Petroleum & Explosives Safety Organisation", items:["Fuel dispensing logs","Pump maintenance records","CCTV compliance"] },
            { body:"PCO",    full:"Pollution Control Organisation",              items:["Fuel type records","Quantity dispensed","Station audit trail"] },
            { body:"Legal Metrology", full:"Weights & Measures Department",     items:["Metered dispense records","Calibration logs","Billing accuracy"] },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ background:"#0E8A5F", color:"#fff", fontSize:9, fontWeight:700,
                  padding:"2px 8px", borderRadius:10 }}>{r.body}</span>
                <span style={{ fontSize:10, color:"#4A6055" }}>{r.full}</span>
              </div>
              {r.items.map((item, j) => (
                <div key={j} style={{ fontSize:11, color:"#7A8E84", padding:"2px 0", paddingLeft:8 }}>
                  ✓ {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Download section */}
      <div className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:"#1A2E25" }}>
            Monthly Compliance Report — {s.period}
          </div>
          <div style={{ fontSize:11, color:"#7A8E84", marginTop:3 }}>
            Auto-generated · PESO/PCO format · {s.total_transactions} transactions included ·
            Compliance score: {s.compliance_score}%
          </div>
        </div>
        <button className="btn btn-primary" onClick={downloadReport}>
          ↓ Download Report
        </button>
      </div>
    </div>
  );
}

const MOCK_SUMMARY = {
  total_transactions: 50,
  fraud_incidents: 3,
  alerts_raised: 3,
  compliance_score: 94.0,
  report_format: "PESO/PCO",
  period: "April 2026",
};
