#!/bin/bash

echo "🔄 Stopping existing services..."

# Kill processes on ports 5173, 5000, and 9000
pkill -f "vite"
pkill -f "nodemon"
pkill -f "peer-server"

# Wait a moment for processes to stop
sleep 2

echo "🚀 Starting services with HTTPS enabled..."

# Start backend
cd backend && npm run dev &
BACKEND_PID=$!

# Start peer server
cd .. && node peer-server.js &
PEER_PID=$!

# Start frontend with HTTPS
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started:"
echo "   Backend PID: $BACKEND_PID"
echo "   Peer Server PID: $PEER_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Access the application at: https://localhost:5173"
echo "🔧 Backend API: https://localhost:5000"
echo "📡 Peer Server: http://localhost:9000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
