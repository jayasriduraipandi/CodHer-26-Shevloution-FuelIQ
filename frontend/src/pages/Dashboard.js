import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS_BAR = ["#C7E9DA","#C7E9DA","#C7E9DA","#C7E9DA","#C7E9DA","#C7E9DA","#0E8A5F"];

export default function Dashboard({ liveData, alerts = [] }) {
  const [tanks,  setTanks]  = useState([]);
  const [pumps,  setPumps]  = useState([]);
  const [history,setHistory]= useState([]);
  const [txnSum, setTxnSum] = useState({});

  useEffect(() => {
    fetch("/api/fuel/levels").then(r=>r.json()).then(setTanks).catch(()=>{});
    fetch("/api/fuel/pumps").then(r=>r.json()).then(setPumps).catch(()=>{});
    fetch("/api/fuel/history").then(r=>r.json()).then(setHistory).catch(()=>{});
    fetch("/api/transactions/summary").then(r=>r.json()).then(setTxnSum).catch(()=>{});
  }, []);

  // Use live data if available
  const revenueToday = liveData?.revenue_today || txnSum.total_revenue || 242000;
  const vehiclesToday = liveData?.vehicles_today || txnSum.total_txns || 241;

  const unresolved = alerts.filter(a => !a.resolved);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Owner Dashboard</div>
        <div className="page-sub">Lakshmi Fuel Station · Anna Salai, Chennai · Live overview</div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Today's Revenue</div>
          <div className="kpi-value">₹{(revenueToday/100000).toFixed(1)}L</div>
          <div className="kpi-delta up">↑ 12% vs yesterday</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Litres Dispensed</div>
          <div className="kpi-value">{liveData ? "~3,820" : "3,820"}L</div>
          <div className="kpi-delta up">↑ 8% today</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Vehicles Served</div>
          <div className="kpi-value">{vehiclesToday}</div>
          <div className="kpi-delta up">Morning shift</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Active Pumps</div>
          <div className="kpi-value">5 / 6</div>
          <div className="kpi-delta warn">⚠ 1 in maintenance</div>
        </div>
      </div>

      {/* Alerts */}
      {unresolved.length > 0 && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-title">Live Alerts</div>
          {unresolved.map((a,i) => (
            <div key={i} className={`alert ${a.severity}`}>
              <div className="alert-dot" />
              <div className="alert-msg"><strong>{a.alert_type}:</strong> {a.message}</div>
              <div className="alert-time">now</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        {/* Tank Levels */}
        <div className="card">
          <div className="card-title">Tank Levels</div>
          {tanks.length === 0
            ? [
                {fuel_type:"Petrol",  level_pct:87, litres:18400},
                {fuel_type:"Diesel",  level_pct:43, litres:9100},
                {fuel_type:"Premium", level_pct:62, litres:6200},
              ].map(t => <TankRow key={t.fuel_type} tank={t} />)
            : tanks.map(t => <TankRow key={t.fuel_type} tank={t} />)
          }
        </div>

        {/* Revenue Chart */}
        <div className="card">
          <div className="card-title">7-Day Revenue</div>
          <div style={{fontSize:20,fontWeight:700,color:"#1A2E25",marginBottom:10}}>₹16.2L</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={history.length ? history : MOCK_HISTORY} barSize={22}>
              <XAxis dataKey="date" tick={{fontSize:9,fill:"#9EB0A6"}} axisLine={false} tickLine={false}/>
              <YAxis hide />
              <Tooltip formatter={v=>`₹${(v/100000).toFixed(1)}L`} contentStyle={{fontSize:11}}/>
              <Bar dataKey="revenue" radius={[3,3,0,0]}>
                {(history.length ? history : MOCK_HISTORY).map((_,i,arr) => (
                  <Cell key={i} fill={i===arr.length-1?"#0E8A5F":"#C7E9DA"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* Pump Status */}
        <div className="card">
          <div className="card-title">Pump Health</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            {(pumps.length ? pumps : MOCK_PUMPS).map(p => (
              <div key={p.id} style={{border:"1px solid #E2EAE6",borderRadius:9,padding:"9px 8px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#7A8E84",marginBottom:4}}>Pump {p.id}</div>
                <span className={`badge-${
                  p.status==="active"?"green":p.status==="idle"?"blue":p.status==="alert"?"red":"amber"
                }`}>
                  {p.status==="maintenance"?"Maint.":p.status.charAt(0).toUpperCase()+p.status.slice(1)}
                </span>
                <div style={{fontSize:9,color:"#4A6055",marginTop:4}}>{p.fuel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff */}
        <div className="card">
          <div className="card-title">Staff On Duty</div>
          {MOCK_STAFF.map((s,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"7px 0",borderBottom:i<MOCK_STAFF.length-1?"1px solid #F0F4F1":"none"}}>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{s.name}</div>
                <div style={{fontSize:10,color:"#7A8E84"}}>{s.role}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:s.flagged?"#EF4444":"#0E8A5F"}}/>
                <span style={{fontSize:10,color:s.flagged?"#EF4444":"#4A6055",fontWeight:500}}>
                  {s.flagged?"Flagged":"Morning"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TankRow({ tank }) {
  const color = tank.level_pct < 40 ? "#F59E0B" : tank.fuel_type==="Premium" ? "#185FA5" : "#0E8A5F";
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,fontWeight:600}}>{tank.fuel_type}</span>
        <span style={{fontSize:11,fontWeight:700,color}}>
          {tank.level_pct.toFixed(1)}% · {tank.litres.toLocaleString()}L
        </span>
      </div>
      <div className="tank-bar">
        <div className="tank-fill" style={{width:`${tank.level_pct}%`,background:color}}/>
      </div>
    </div>
  );
}

const MOCK_HISTORY = [
  {date:"Mon",revenue:210000},{date:"Tue",revenue:185000},{date:"Wed",revenue:240000},
  {date:"Thu",revenue:160000},{date:"Fri",revenue:230000},{date:"Sat",revenue:290000},
  {date:"Sun",revenue:242000},
];
const MOCK_PUMPS = [
  {id:1,status:"active",fuel:"Petrol"},{id:2,status:"active",fuel:"Diesel"},
  {id:3,status:"alert", fuel:"Petrol"},{id:4,status:"idle",  fuel:"Premium"},
  {id:5,status:"active",fuel:"Diesel"},{id:6,status:"maintenance",fuel:"Petrol"},
];
const MOCK_STAFF = [
  {name:"Ravi Kumar",  role:"Attendant · Pump 3",flagged:true},
  {name:"Karthik S",  role:"Attendant · Pumps 1,2"},
  {name:"Priya R",    role:"Cashier"},
  {name:"Meena D",    role:"Supervisor"},
];
