import sqlite3, os, datetime, random

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fueliq.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS fuel_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fuel_type TEXT NOT NULL,
        level_pct REAL NOT NULL,
        litres REAL NOT NULL,
        recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        vehicle_no TEXT NOT NULL,
        fuel_type TEXT NOT NULL,
        slot_date TEXT NOT NULL,
        slot_time TEXT NOT NULL,
        status TEXT DEFAULT 'booked',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_no TEXT NOT NULL,
        fuel_type TEXT NOT NULL,
        litres REAL NOT NULL,
        billed_litres REAL NOT NULL,
        amount REAL NOT NULL,
        pump_id INTEGER NOT NULL,
        staff_name TEXT NOT NULL,
        fraud_flag INTEGER DEFAULT 0,
        fraud_score REAL DEFAULT 0.0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        resolved INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        pump_assigned TEXT,
        shift TEXT NOT NULL,
        status TEXT DEFAULT 'on_duty',
        vehicles_served INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # Seed with sample data if empty
    if c.execute("SELECT COUNT(*) FROM fuel_levels").fetchone()[0] == 0:
        _seed_data(c)

    conn.commit()
    conn.close()

def _seed_data(c):
    now = datetime.datetime.now().isoformat()

    # Fuel levels
    fuels = [("Petrol", 87.0, 18400), ("Diesel", 43.0, 9100), ("Premium", 62.0, 6200)]
    for ft, pct, litres in fuels:
        c.execute("INSERT INTO fuel_levels (fuel_type, level_pct, litres, recorded_at) VALUES (?,?,?,?)",
                  (ft, pct, litres, now))

    # Staff
    staff = [
        ("Karthik Sundar",  "Senior Attendant", "1,2", "Morning"),
        ("Priya R",         "Cashier",           None,  "Morning"),
        ("Ravi Kumar",      "Attendant",         "3",   "Morning"),
        ("Meena D",         "Supervisor",        None,  "Morning"),
        ("Suresh P",        "Attendant",         "4,5", "Afternoon"),
        ("Lakshmi V",       "Cashier",           None,  "Afternoon"),
        ("Dinesh K",        "Attendant",         "6",   "Night"),
        ("Anand R",         "Supervisor",        None,  "Night"),
    ]
    for s in staff:
        c.execute("INSERT INTO staff (name, role, pump_assigned, shift, created_at) VALUES (?,?,?,?,?)",
                  (*s, now))

    # Transactions (last 50)
    vehicles = ["TN01AB4421","TN22CD7890","TN05EF1122","TN09GH3344","TN33IJ5566","TN44KL7788","TN55MN9900"]
    fuels2  = ["Petrol","Diesel","Premium"]
    staff_n = ["Karthik Sundar","Ravi Kumar","Meena D"]
    for i in range(50):
        fuel_t = random.choice(fuels2)
        litres = round(random.uniform(5, 40), 1)
        billed = round(litres - random.uniform(0, 0.5), 1)
        price  = {"Petrol":104.72,"Diesel":93.14,"Premium":116.80}[fuel_t]
        fraud  = 1 if (litres - billed) > 2.0 else 0
        score  = round((litres - billed) / litres, 3)
        dt = (datetime.datetime.now() - datetime.timedelta(hours=i*0.5)).isoformat()
        c.execute("""INSERT INTO transactions
            (vehicle_no, fuel_type, litres, billed_litres, amount, pump_id, staff_name, fraud_flag, fraud_score, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (random.choice(vehicles), fuel_t, litres, billed, round(billed*price,2),
             random.randint(1,6), random.choice(staff_n), fraud, score, dt))

    # Alerts
    sample_alerts = [
        ("fraud",    "critical", "Pump #3 — 12.4L dispensed, 10.1L billed · AI flagged"),
        ("stock",    "warning",  "Diesel at 43% — estimated 9 hrs remaining"),
        ("reorder",  "info",     "Petrol 15,000L reorder placed · delivery tomorrow 6AM"),
    ]
    for at, sev, msg in sample_alerts:
        c.execute("INSERT INTO alerts (alert_type, severity, message, created_at) VALUES (?,?,?,?)",
                  (at, sev, msg, now))

    # Slots (next 2 days)
    slot_data = [
        ("Ananya S",  "TN01AB4421","Petrol", "2026-04-10","09:00"),
        ("Rahul M",   "TN22CD7890","Diesel", "2026-04-10","09:30"),
        ("Kavya P",   "TN05EF1122","Premium","2026-04-10","10:00"),
        ("Vijay K",   "TN33IJ5566","Petrol", "2026-04-11","08:00"),
        ("Meena S",   "TN44KL7788","Diesel", "2026-04-11","08:30"),
    ]
    for sd in slot_data:
        c.execute("INSERT INTO slots (customer_name, vehicle_no, fuel_type, slot_date, slot_time, created_at) VALUES (?,?,?,?,?,?)",
                  (*sd, now))
