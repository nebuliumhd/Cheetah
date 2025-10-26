#!/bin/bash

# Start the backend
echo "Starting backend..."
cd ../../backend
npm install
npm run dev &
BACKEND_PID=$!

# Start the frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

cleanup() {
    echo "Stopping frontend and backend..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

trap cleanup SIGINT
wait $BACKEND_PID $FRONTEND_PID