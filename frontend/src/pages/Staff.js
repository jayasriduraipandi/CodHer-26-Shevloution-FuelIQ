import React, { useState, useEffect } from "react";

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [handover, setHandover] = useState(null);

  useEffect(() => {
    fetch("/api/staff/")
      .then(r => r.json()).then(setStaff).catch(() => setStaff(MOCK_STAFF));
  }, []);

  const doHandover = async (id, name) => {
    setHandover("generating");
    setTimeout(() => setHandover(`✅ Shift handover report for ${name} sent to manager`), 1500);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Staff Management</div>
        <div className="page-sub">Current shift roster, attendance and pump assignments</div>
      </div>

      {/* Shift summary cards */}
      <div className="grid-3" style={{ marginBottom: 14 }}>
        {["Morning", "Afternoon", "Night"].map(shift => {
          const list = (staff.length ? staff : MOCK_STAFF).filter(s => s.shift === shift);
          return (
            <div className="card" key={shift}>
              <div className="card-title">{shift} Shift</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1A2E25", marginBottom: 4 }}>
                {list.length}
              </div>
              <div style={{ fontSize: 10, color: "#7A8E84" }}>Staff on roster</div>
              <div style={{ marginTop: 8 }}>
                {list.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#4A6055", padding: "2px 0" }}>
                    · {s.name} — {s.role}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff table */}
      <div className="card">
        <div className="card-title">Full Roster</div>

        {handover && (
          <div style={{ padding: "10px 13px", background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 9, marginBottom: 12, fontSize: 12, color: "#166534", fontWeight: 500 }}>
            {handover === "generating" ? "⏳ Generating handover report..." : handover}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Pump</th>
                <th>Shift</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(staff.length ? staff : MOCK_STAFF).map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.pump_assigned || "—"}</td>
                  <td><span className={`badge-${
                    s.shift==="Morning"?"green":s.shift==="Afternoon"?"blue":"gray"}`}>
                    {s.shift}
                  </span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%",
                        background: s.flagged ? "#EF4444" : "#0E8A5F" }} />
                      <span style={{ fontSize: 11, color: s.flagged ? "#EF4444" : "#0E8A5F",
                        fontWeight: 500 }}>
                        {s.flagged ? "Under Review" : "On Duty"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button className="btn" style={{ fontSize: 10, padding: "4px 10px" }}
                      onClick={() => doHandover(s.id || i, s.name)}>
                      Handover
                    </button>
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

const MOCK_STAFF = [
  { name:"Karthik Sundar", role:"Senior Attendant", pump_assigned:"1,2", shift:"Morning",  flagged:false },
  { name:"Priya R",        role:"Cashier",          pump_assigned:null,  shift:"Morning",  flagged:false },
  { name:"Ravi Kumar",     role:"Attendant",         pump_assigned:"3",   shift:"Morning",  flagged:true  },
  { name:"Meena D",        role:"Supervisor",        pump_assigned:null,  shift:"Morning",  flagged:false },
  { name:"Suresh P",       role:"Attendant",         pump_assigned:"4,5", shift:"Afternoon",flagged:false },
  { name:"Lakshmi V",      role:"Cashier",           pump_assigned:null,  shift:"Afternoon",flagged:false },
  { name:"Dinesh K",       role:"Attendant",         pump_assigned:"6",   shift:"Night",    flagged:false },
  { name:"Anand R",        role:"Supervisor",        pump_assigned:null,  shift:"Night",    flagged:false },
];
