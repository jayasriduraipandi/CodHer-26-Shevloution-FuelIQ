"""
FuelIQ — IoT Sensor Simulator
Simulates tank level sensors + pump vibration sensors
and publishes data to HiveMQ free cloud MQTT broker.

Run: python simulator.py
"""

import time, json, random, datetime
import paho.mqtt.client as mqtt

# ── HiveMQ free cloud broker (no account needed) ───────────────────
BROKER   = "broker.hivemq.com"
PORT     = 1883
CLIENT_ID = "fueliq-simulator-001"

# Topics
TOPIC_TANK    = "fueliq/station/001/tank"
TOPIC_PUMP    = "fueliq/station/001/pump"
TOPIC_ALERT   = "fueliq/station/001/alert"

# Initial tank state (litres)
tank_state = {"petrol": 18400.0, "diesel": 9100.0, "premium": 6200.0}
CAPACITIES  = {"petrol": 21000.0, "diesel": 21000.0, "premium": 10000.0}

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[✓] Connected to HiveMQ broker at {BROKER}")
    else:
        print(f"[✗] Failed to connect, code {rc}")

def on_publish(client, userdata, mid):
    pass  # silent publish confirmation

def simulate_tank_level():
    """Decrease tank by random consumption each tick"""
    for fuel in tank_state:
        drain = random.uniform(10, 35)
        tank_state[fuel] = max(0, tank_state[fuel] - drain)
    return {
        fuel: {
            "litres":    round(tank_state[fuel], 1),
            "pct":       round(tank_state[fuel] / CAPACITIES[fuel] * 100, 1),
            "timestamp": datetime.datetime.now().isoformat(),
        }
        for fuel in tank_state
    }

def simulate_pump_vibration():
    """6 pumps, pump 6 shows abnormal vibration (maintenance)"""
    pumps = []
    for i in range(1, 7):
        normal = i != 6
        pumps.append({
            "pump_id":   i,
            "vibration": round(random.uniform(0.1, 0.4) if normal else random.uniform(1.2, 2.5), 3),
            "temp_c":    round(random.uniform(38, 45) if normal else random.uniform(60, 75), 1),
            "status":    "normal" if normal else "warning",
            "timestamp": datetime.datetime.now().isoformat(),
        })
    return pumps

def check_alerts(tank_data):
    """Fire alert if any tank below 40%"""
    alerts = []
    for fuel, data in tank_data.items():
        if data["pct"] < 40:
            alerts.append({
                "type":    "low_stock",
                "fuel":    fuel,
                "pct":     data["pct"],
                "litres":  data["litres"],
                "message": f"{fuel.title()} at {data['pct']}% — estimated {data['litres']/1500:.1f} hrs remaining",
            })
    return alerts

def run():
    client = mqtt.Client(client_id=CLIENT_ID)
    client.on_connect = on_connect
    client.on_publish  = on_publish

    print(f"[~] Connecting to {BROKER}:{PORT} ...")
    try:
        client.connect(BROKER, PORT, keepalive=60)
        client.loop_start()
    except Exception as e:
        print(f"[!] MQTT connection failed: {e}")
        print("[~] Running in offline mode (printing to console only)")
        client = None

    print("[~] Simulator started. Publishing every 3 seconds. Press Ctrl+C to stop.\n")

    try:
        tick = 0
        while True:
            tick += 1
            tank_data = simulate_tank_level()
            pump_data = simulate_pump_vibration()
            alerts    = check_alerts(tank_data)

            tank_payload = json.dumps(tank_data)
            pump_payload = json.dumps(pump_data)

            if client:
                client.publish(TOPIC_TANK, tank_payload)
                client.publish(TOPIC_PUMP, pump_payload)
                for alert in alerts:
                    client.publish(TOPIC_ALERT, json.dumps(alert))

            # Console output for demo
            print(f"[Tick {tick:04d}] {datetime.datetime.now().strftime('%H:%M:%S')}")
            for fuel, d in tank_data.items():
                bar = "█" * int(d["pct"] / 5) + "░" * (20 - int(d["pct"] / 5))
                flag = " ⚠ LOW" if d["pct"] < 40 else ""
                print(f"  {fuel.upper():<10} [{bar}] {d['pct']:5.1f}% ({d['litres']:7,.0f}L){flag}")

            pump_warnings = [p for p in pump_data if p["status"] == "warning"]
            if pump_warnings:
                for pw in pump_warnings:
                    print(f"  ⚠ Pump {pw['pump_id']} HIGH VIBRATION: {pw['vibration']} g | Temp: {pw['temp_c']}°C")

            if alerts:
                for a in alerts:
                    print(f"  🔴 ALERT: {a['message']}")

            print()
            time.sleep(3)

    except KeyboardInterrupt:
        print("\n[~] Simulator stopped.")
        if client:
            client.loop_stop()
            client.disconnect()

if __name__ == "__main__":
    run()
