#!/bin/bash

# Debug info
cd "$(dirname "$0")"

# Build the frontend
echo "Building frontend..."
cd ../../frontend
npm install
npm run build

# Build the backend
echo "Building backend..."
cd ../backend
npm install

# Start the app from the backend
echo "Starting the backend in production mode..."
sudo pm2 start server.js --name chetchat
sudo pm2 save
sudo pm2 status