import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

export default function Forecast() {
  const [forecast, setForecast] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [reorder,  setReorder]  = useState([]);
  const [tab, setTab] = useState("forecast");

  useEffect(() => {
    fetch("/api/forecast/forecast").then(r=>r.json()).then(setForecast).catch(()=>setForecast(MOCK_FORECAST));
    fetch("/api/forecast/history?days=14").then(r=>r.json()).then(setHistory).catch(()=>setHistory(MOCK_HISTORY));
    fetch("/api/forecast/reorder-check").then(r=>r.json()).then(setReorder).catch(()=>setReorder(MOCK_REORDER));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Demand Forecast</div>
        <div className="page-sub">ML-predicted daily fuel demand · Linear regression on 90-day synthetic history</div>
      </div>

      {/* Reorder alerts */}
      {reorder.length > 0 && reorder.map((r,i) => (
        <div key={i} className="alert warning" style={{ marginBottom: 8 }}>
          <div className="alert-dot" />
          <div className="alert-msg">
            <strong>Reorder Needed — {r.fuel}:</strong> {r.current_litres?.toLocaleString()}L remaining
            ({r.pct}%) · ~{r.hours_remaining} hrs · {r.action}
          </div>
        </div>
      ))}

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {["forecast","history"].map(t => (
          <button key={t} className={`btn ${tab===t?"btn-primary":""}`}
            onClick={()=>setTab(t)}>
            {t === "forecast" ? "7-Day Forecast" : "14-Day History"}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">
          {tab === "forecast" ? "Predicted Demand (Next 7 Days)" : "Actual Demand (Last 14 Days)"}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={tab==="forecast" ? forecast : history}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F1" />
            <XAxis dataKey={tab==="forecast"?"day":"date"}
              tick={{ fontSize: 10, fill: "#9EB0A6" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9EB0A6" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(v, n) => [`${v.toLocaleString()}L`, n.charAt(0).toUpperCase()+n.slice(1)]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="petrol"  stroke="#0E8A5F" strokeWidth={2} dot={false} name="Petrol" />
            <Line type="monotone" dataKey="diesel"  stroke="#185FA5" strokeWidth={2} dot={false} name="Diesel" />
            <Line type="monotone" dataKey="premium" stroke="#B45309" strokeWidth={2} dot={false} name="Premium" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast table */}
      {tab === "forecast" && (
        <div className="card">
          <div className="card-title">Forecast Details</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Day</th><th>Date</th><th>Petrol (L)</th><th>Diesel (L)</th><th>Premium (L)</th><th>Total</th></tr></thead>
              <tbody>
                {(forecast.length ? forecast : MOCK_FORECAST).map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600 }}>{f.day}</td>
                    <td style={{ fontSize:11, color:"#7A8E84" }}>{f.date}</td>
                    <td style={{ color:"#0E8A5F", fontWeight:600 }}>{Number(f.petrol).toLocaleString()}</td>
                    <td style={{ color:"#185FA5", fontWeight:600 }}>{Number(f.diesel).toLocaleString()}</td>
                    <td style={{ color:"#B45309", fontWeight:600 }}>{Number(f.premium).toLocaleString()}</td>
                    <td style={{ fontWeight:700 }}>{(Number(f.petrol)+Number(f.diesel)+Number(f.premium)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_FORECAST = [
  {day:"Friday",  date:"2026-04-11",petrol:3200,diesel:1800,premium:700},
  {day:"Saturday",date:"2026-04-12",petrol:3800,diesel:2200,premium:900},
  {day:"Sunday",  date:"2026-04-13",petrol:3850,diesel:2150,premium:880},
  {day:"Monday",  date:"2026-04-14",petrol:3100,diesel:1750,premium:680},
  {day:"Tuesday", date:"2026-04-15",petrol:3250,diesel:1820,premium:710},
  {day:"Wednesday",date:"2026-04-16",petrol:3300,diesel:1900,premium:730},
  {day:"Thursday",date:"2026-04-17",petrol:3150,diesel:1780,premium:695},
];
const MOCK_HISTORY = Array.from({length:14},(_,i)=>({
  date:`Apr ${i+1}`,
  petrol:  Math.round(3000+Math.random()*900),
  diesel:  Math.round(1600+Math.random()*700),
  premium: Math.round(600+Math.random()*350),
}));
const MOCK_REORDER = [
  { fuel:"Diesel", current_litres:9100, pct:43.3, hours_remaining:9.2, action:"Place reorder immediately" }
];
