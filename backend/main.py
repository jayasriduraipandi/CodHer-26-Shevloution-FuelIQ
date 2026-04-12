from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import asyncio, json, random, datetime

from routes import fuel, slots, transactions, alerts, staff, compliance
from models.database import init_db

app = FastAPI(title="FuelIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(fuel.router,         prefix="/api/fuel",         tags=["Fuel Levels"])
app.include_router(slots.router,        prefix="/api/slots",        tags=["Slot Booking"])
app.include_router(transactions.router, prefix="/api/transactions",  tags=["Transactions"])
app.include_router(alerts.router,       prefix="/api/alerts",       tags=["Alerts"])
app.include_router(staff.router,        prefix="/api/staff",        tags=["Staff"])
app.include_router(compliance.router,   prefix="/api/compliance",   tags=["Compliance"])

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.active:
            try:
                await ws.send_json(data)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            
            payload = {
                "type": "sensor_update",
                "timestamp": datetime.datetime.now().isoformat(),
                "tanks": {
                    "petrol":  round(random.uniform(80, 92), 1),
                    "diesel":  round(random.uniform(38, 50), 1),
                    "premium": round(random.uniform(58, 68), 1),
                },
                "pumps": [
                    {"id": i+1, "status": random.choice(["active","active","idle","active"]),
                     "fuel": ["Petrol","Diesel","Premium","Petrol","Diesel","Petrol"][i]}
                    for i in range(6)
                ],
                "revenue_today": round(random.uniform(230000, 260000), 0),
                "vehicles_today": random.randint(220, 260),
            }
            await manager.broadcast(payload)
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/")
def root():
    return {"message": "FuelIQ API is running", "docs": "/docs"}

from ml.demand_forecast import router as forecast_router
app.include_router(forecast_router, prefix="/api/forecast", tags=["Forecast"])
