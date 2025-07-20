#!/bin/bash

echo "========================================"
echo "  SehatyNet+ Telehealth Platform"
echo "========================================"
echo

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

echo "[1/4] Installing frontend dependencies..."
npm install || handle_error "Failed to install frontend dependencies"

echo "[2/4] Installing backend dependencies..."
cd backend
npm install || handle_error "Failed to install backend dependencies"
cd ..

echo "[3/4] Building backend..."
cd backend
npm run build || handle_error "Failed to build backend"
cd ..

echo "[4/4] Starting both servers..."
echo
echo "Backend will run on: https://localhost:5000"
echo "Frontend will run on: https://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers"
echo

npm run start 