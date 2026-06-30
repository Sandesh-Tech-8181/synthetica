#!/usr/bin/env bash
# ============================================================
# Synthetica — local startup script
# Boots the FastAPI backend and a static file server for the
# frontend, with one command.
#
# Usage:
#   chmod +x start.sh
#   ./start.sh
#
# Then open:
#   Frontend  -> http://localhost:3000
#   Dashboard -> http://localhost:3000/dashboard.html
#   Backend   -> http://localhost:8000/api/health
#
# Stop everything with CTRL+C.
# ============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"

echo "🌍 Starting Synthetica..."
echo ""

# ---- 1. Set up Python virtual environment (first run only) ----
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "📦 Installing backend dependencies..."
pip install -q --upgrade pip
pip install -q -r "$BACKEND_DIR/requirements.txt"

# ---- 2. Start backend (FastAPI on :8000) ----
echo "🚀 Starting backend on http://localhost:8000 ..."
(cd "$BACKEND_DIR" && uvicorn server:app --reload --port 8000 > "$ROOT_DIR/backend.log" 2>&1 &)
BACKEND_PID=$!

# Give the backend a moment to boot, then verify health
sleep 2
if curl -s http://localhost:8000/api/health > /dev/null; then
  echo "✅ Backend is healthy."
else
  echo "⚠️  Backend did not respond yet — check backend.log for details."
fi

# ---- 3. Start frontend (static file server on :3000) ----
echo "🚀 Starting frontend on http://localhost:3000 ..."
(cd "$ROOT_DIR" && python3 -m http.server 3000 > "$ROOT_DIR/frontend.log" 2>&1 &)

echo ""
echo "============================================================"
echo " Synthetica is running"
echo "   Landing page : http://localhost:3000/index.html"
echo "   Dashboard    : http://localhost:3000/dashboard.html"
echo "   Backend API  : http://localhost:8000/api/health"
echo "   WebSocket    : ws://localhost:8000/ws"
echo ""
echo " Logs: backend.log / frontend.log"
echo " Press CTRL+C to stop, then run: kill \$(jobs -p)"
echo "============================================================"

# Keep script alive so background processes stay attached to this shell
wait
