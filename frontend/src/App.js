import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Slots from "./pages/Slots";
import Staff from "./pages/Staff";
import Forecast from "./pages/Forecast";
import Compliance from "./pages/Compliance";
import "./App.css";

const NAV = [
  { id:"dashboard",    label:"Dashboard",    icon:"⬡" },
  { id:"transactions", label:"Transactions", icon:"💳" },
  { id:"slots",        label:"Slots",        icon:"📅" },
  { id:"staff",        label:"Staff",        icon:"👥" },
  { id:"forecast",     label:"Forecast",     icon:"📈" },
  { id:"compliance",   label:"Compliance",   icon:"📄" },
];

export default function App() {
  const [page, setPage]     = useState("dashboard");
  const [alerts, setAlerts] = useState([]);
  const [live, setLive]     = useState(null);

  // WebSocket for live sensor data
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/live");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setLive(data);
    };
    ws.onerror = () => console.log("WS not connected — using static data");
    return () => ws.close();
  }, []);

  // Poll alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const r = await fetch("/api/alerts/");
        const d = await r.json();
        setAlerts(d);
        d.forEach(a => {
          if (a.severity === "critical") toast.error(a.message, { duration: 6000 });
        });
      } catch (_) {}
    };
    fetchAlerts();
    const t = setInterval(fetchAlerts, 15000);
    return () => clearInterval(t);
  }, []);

  const pages = { dashboard:Dashboard, transactions:Transactions, slots:Slots,
                  staff:Staff, forecast:Forecast, compliance:Compliance };
  const Page = pages[page] || Dashboard;

  return (
    <div className="app">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">⛽</div>
          <div>
            <div className="brand-name">FuelIQ</div>
            <div className="brand-sub">Owner Portal</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              {n.id === "dashboard" && alerts.filter(a=>!a.resolved).length > 0 && (
                <span className="badge">{alerts.filter(a=>!a.resolved).length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="station-info">
            <div className="station-name">Lakshmi Fuel Station</div>
            <div className="station-loc">Anna Salai, Chennai</div>
          </div>
          <div className={`live-dot ${live ? "connected" : ""}`}
               title={live ? "Live data" : "Offline"}>
            {live ? "● LIVE" : "○ Offline"}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        <Page liveData={live} alerts={alerts} />
      </main>
    </div>
  );
}
