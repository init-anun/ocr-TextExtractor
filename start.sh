#!/bin/bash

# Exit on error
set -e

echo "==============================================="
echo "      OCR Text Extractor Application"
echo "==============================================="

# Get directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Backend
echo "Starting FastAPI backend server on http://localhost:8000..."
cd "$DIR/fastapi-react-app/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting React frontend server on http://localhost:5173..."
cd "$DIR/fastapi-react-app/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# Graceful cleanup on terminate
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Done!"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Both servers are starting..."
echo "Press Ctrl+C to stop both servers."
echo "==============================================="

# Wait for both processes
wait
