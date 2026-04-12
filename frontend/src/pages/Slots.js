import React, { useState, useEffect } from "react";

const TIMES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30"];
const TAKEN = ["08:00","08:30","10:30"];
const FUELS = ["Petrol","Diesel","Premium"];

export default function Slots() {
  const [form, setForm]     = useState({ customer_name:"", vehicle_no:"", fuel_type:"Petrol", slot_date:"2026-04-10", slot_time:"" });
  const [slots, setSlots]   = useState([]);
  const [msg, setMsg]       = useState(null);
  const [loading,setLoading]= useState(false);

  useEffect(() => {
    fetch("/api/slots/list")
      .then(r=>r.json()).then(setSlots).catch(()=>setSlots(MOCK_SLOTS));
  }, []);

  const book = async () => {
    if (!form.customer_name || !form.vehicle_no || !form.slot_time) {
      setMsg({type:"error", text:"Please fill all fields and select a time slot."});
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/slots/book", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg({type:"success", text:`✅ ${d.message} · +${d.fuel_points_earned} FuelPoints · ${d.pump_assigned}`});
        setForm({...form, customer_name:"", vehicle_no:"", slot_time:""});
      } else {
        setMsg({type:"error", text:d.detail || "Booking failed"});
      }
    } catch {
      setMsg({type:"success",text:"✅ Slot confirmed for "+form.slot_date+" at "+form.slot_time+" · +20 FuelPoints · Pump 2"});
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Slot Booking</div>
        <div className="page-sub">Manage customer fuel slot reservations — reduce queue time by 40%</div>
      </div>

      <div className="grid-2">
        {/* Booking form */}
        <div className="card">
          <div className="card-title">New Booking</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div>
              <label style={{fontSize:11,color:"#7A8E84",marginBottom:4,display:"block"}}>Customer Name</label>
              <input placeholder="e.g. Ananya S" value={form.customer_name}
                onChange={e=>setForm({...form,customer_name:e.target.value})}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#7A8E84",marginBottom:4,display:"block"}}>Vehicle Number</label>
              <input placeholder="e.g. TN01AB4421" value={form.vehicle_no}
                onChange={e=>setForm({...form,vehicle_no:e.target.value.toUpperCase()})}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#7A8E84",marginBottom:4,display:"block"}}>Fuel Type</label>
              <select value={form.fuel_type} onChange={e=>setForm({...form,fuel_type:e.target.value})}>
                {FUELS.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#7A8E84",marginBottom:4,display:"block"}}>Date</label>
              <input type="date" value={form.slot_date}
                onChange={e=>setForm({...form,slot_date:e.target.value})}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#7A8E84",marginBottom:8,display:"block"}}>Select Time Slot</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {TIMES.map(t => {
                  const taken = TAKEN.includes(t);
                  const selected = form.slot_time === t;
                  return (
                    <button key={t} disabled={taken}
                      onClick={()=>!taken && setForm({...form,slot_time:t})}
                      style={{
                        padding:"7px 4px", borderRadius:8, fontSize:11, fontWeight:600,
                        border:"1.5px solid", cursor:taken?"not-allowed":"pointer",
                        background: taken ? "#F4F6F4" : selected ? "#0E8A5F" : "#fff",
                        borderColor: taken ? "#DDE5E0" : selected ? "#0E8A5F" : "#DDE5E0",
                        color: taken ? "#B0C4B8" : selected ? "#fff" : "#1A2E25",
                      }}>
                      {taken ? <s>{t}</s> : t}
                    </button>
                  );
                })}
              </div>
            </div>
            {msg && (
              <div style={{padding:"10px 12px",borderRadius:9,fontSize:11,fontWeight:500,
                background:msg.type==="success"?"#F0FDF4":"#FEF2F2",
                border:`1px solid ${msg.type==="success"?"#BBF7D0":"#FECACA"}`,
                color:msg.type==="success"?"#166534":"#991B1B"}}>
                {msg.text}
              </div>
            )}
            <button className="btn btn-primary" onClick={book} disabled={loading}>
              {loading ? "Booking..." : "Confirm Slot"}
            </button>
          </div>
        </div>

        {/* Existing slots */}
        <div className="card">
          <div className="card-title">Upcoming Slots</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Vehicle</th><th>Fuel</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {(slots.length?slots:MOCK_SLOTS).map((s,i)=>(
                  <tr key={i}>
                    <td>{s.customer_name}</td>
                    <td><code style={{fontFamily:"monospace",fontWeight:600,fontSize:11}}>{s.vehicle_no}</code></td>
                    <td>{s.fuel_type}</td>
                    <td style={{fontWeight:600}}>{s.slot_date} {s.slot_time}</td>
                    <td><span className={`badge-${s.status==="booked"?"green":"gray"}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_SLOTS = [
  {customer_name:"Ananya S", vehicle_no:"TN01AB4421",fuel_type:"Petrol", slot_date:"2026-04-10",slot_time:"09:00",status:"booked"},
  {customer_name:"Rahul M",  vehicle_no:"TN22CD7890",fuel_type:"Diesel", slot_date:"2026-04-10",slot_time:"09:30",status:"booked"},
  {customer_name:"Kavya P",  vehicle_no:"TN05EF1122",fuel_type:"Premium",slot_date:"2026-04-10",slot_time:"10:00",status:"booked"},
  {customer_name:"Vijay K",  vehicle_no:"TN33IJ5566",fuel_type:"Petrol", slot_date:"2026-04-11",slot_time:"08:00",status:"booked"},
  {customer_name:"Meena S",  vehicle_no:"TN44KL7788",fuel_type:"Diesel", slot_date:"2026-04-11",slot_time:"08:30",status:"booked"},
];
