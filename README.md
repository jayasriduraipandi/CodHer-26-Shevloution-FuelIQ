# ⛽ FuelIQ — Smart Fuel Station Management Platform
> CodHer '26 · Track 5 — Business Optimization with Tech
> Presented by **Jayasri Duraipandi** & **Roja R**

---

## What is FuelIQ?

FuelIQ is an AI + IoT powered ecosystem that turns a traditional petrol pump into a smart, data-driven operation. It has three surfaces:

| Surface | Tech | Who uses it |
|---|---|---|
| Owner Dashboard | React.js Web App | Station owner |
| IoT Simulator | Python + MQTT | Simulates sensors |
| AI / ML Engine | scikit-learn | Fraud + forecast |

---

## Project Structure

```
FuelIQ/
├── backend/               ← Python FastAPI backend
│   ├── main.py            ← App entry point + WebSocket
│   ├── requirements.txt
│   ├── models/
│   │   └── database.py    ← SQLite setup + seed data
│   ├── routes/
│   │   ├── fuel.py        ← Tank levels + pump status
│   │   ├── slots.py       ← Slot booking + queue
│   │   ├── transactions.py← Billing + fraud check
│   │   ├── alerts.py      ← Alert CRUD
│   │   ├── staff.py       ← Staff management
│   │   └── compliance.py  ← Report generation
│   └── ml/
│       ├── fraud_detection.py  ← Isolation Forest model
│       └── demand_forecast.py  ← Linear regression forecast
│
├── frontend/              ← React.js Owner Dashboard
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js + App.css
│       └── pages/
│           ├── Dashboard.js   ← KPIs, tanks, revenue chart
│           ├── Transactions.js← All txns + fraud scores
│           ├── Slots.js       ← Booking form + slot list
│           ├── Staff.js       ← Roster + handover
│           ├── Forecast.js    ← ML demand chart
│           └── Compliance.js  ← Report download
│
├── iot-simulator/         ← Simulates IoT sensors
│   ├── simulator.py       ← MQTT publisher to HiveMQ
│   └── requirements.txt
│
└── README.md
```

---

## Quick Start (Run in 3 terminals)

### Terminal 1 — Backend

```bash
cd FuelIQ/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### Terminal 2 — Frontend

```bash
cd FuelIQ/frontend
npm install
npm start
```

Dashboard opens at: **http://localhost:3000**

### Terminal 3 — IoT Simulator

```bash
cd FuelIQ/iot-simulator
pip install -r requirements.txt
python simulator.py
```

Publishes sensor data every 3 seconds to HiveMQ.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/fuel/levels` | Current tank levels |
| GET | `/api/fuel/pumps` | Pump status + health |
| GET | `/api/fuel/history` | 7-day revenue history |
| POST | `/api/slots/book` | Book a fuel slot |
| GET | `/api/slots/queue/{vehicle}` | Queue position |
| POST | `/api/transactions/record` | Record + fraud-check |
| GET | `/api/transactions/fraud-alerts` | All flagged txns |
| GET | `/api/alerts/` | Live alerts |
| GET | `/api/staff/` | Full staff roster |
| GET | `/api/forecast/forecast` | 7-day demand forecast |
| GET | `/api/compliance/report` | Download compliance report |
| WS | `/ws/live` | Live WebSocket data stream |

---

## AI / ML Modules

### Fraud Detection (Isolation Forest)
- Trains on 2,000 synthetic transactions
- Features: litres dispensed, diff litres, diff ratio, amount
- Contamination: 5% (industry-realistic)
- Flags any transaction where diff > 2 litres OR anomaly score > threshold
- Model saved to `fraud_model.pkl` after first run

### Demand Forecasting (Linear Regression)
- Features: day of week, is_weekend
- Separate model per fuel type (Petrol, Diesel, Premium)
- 90-day synthetic training history
- Outputs: predicted litres per day for next 7 days
- Reorder alert triggered when tank < 40%

---

## IoT Simulation Details

The `simulator.py` script replaces real hardware for demo:

| Real Hardware | Simulated As |
|---|---|
| HC-SR04 Ultrasonic Tank Sensor | Python random float decreasing |
| MPU-6050 Vibration Sensor | Python random float, Pump 6 = high |
| IP Camera (CCTV) | Triggered by diff > 2L in fraud check |
| FASTag RFID Reader | Mock vehicle lookup dictionary |

Data is published to `broker.hivemq.com` (free, no account needed).

Topics:
- `fueliq/station/001/tank` — Tank levels
- `fueliq/station/001/pump` — Pump vibration + temp
- `fueliq/station/001/alert` — Low stock alerts

---

## Real-world Deployment Constraints

The following features work fully in the prototype but need regulatory approval for production:

| Feature | Authorization Needed |
|---|---|
| FASTag live read | NETC / NPCI authorization |
| Fuel meter hookup | Legal Metrology Act — Weights & Measures Dept. |
| Live UPI payments | RBI payment aggregator license |
| CCTV at station | PESO installation clearance |
| Vahan DB access | MoRTH government API access |
| Tank sensor install | PESO fire & safety clearance |

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React.js, Recharts, Axios, react-hot-toast |
| Backend | Python, FastAPI, SQLite, WebSockets |
| AI / ML | scikit-learn, NumPy, Pandas, joblib |
| IoT | paho-mqtt, HiveMQ free broker |
| Deploy | Vercel (frontend), Railway (backend) |

---

## Team

**Jayasri Duraipandi**
Department of Software Systems
Sri Krishna Arts and Science College, Coimbatore

**Roja R**
Department of English
Pondicherry University, Puducherry

---

*FuelIQ — Fuelling Smarter India 🇮🇳*
