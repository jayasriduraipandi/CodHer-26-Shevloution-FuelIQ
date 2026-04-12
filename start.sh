#!/bin/bash
# FuelIQ — Quick Demo Launcher
# Run this script to start everything at once

echo ""
echo "  ⛽  FuelIQ — Smart Fuel Station Management"
echo "  ==========================================="
echo "  CodHer '26 · Track 5 · Jayasri Duraipandi & Roja R"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "  [✗] Python3 not found. Please install Python 3.10+"
  exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
  echo "  [✗] Node.js not found. Please install Node 18+"
  exit 1
fi

echo "  [1/3] Installing backend dependencies..."
cd backend && pip install -r requirements.txt -q && cd ..

echo "  [2/3] Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..

echo ""
echo "  Starting services..."
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo "  API Docs → http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services."
echo ""

# Start backend
cd backend && uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
cd ../frontend && npm start &
FRONTEND_PID=$!

# Start IoT simulator
cd ../iot-simulator && python3 simulator.py &
SIM_PID=$!

# Wait for any to exit
wait $BACKEND_PID $FRONTEND_PID $SIM_PID

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID $SIM_PID 2>/dev/null" EXIT
