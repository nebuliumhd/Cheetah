#!/bin/bash

PROJECT_DIR="/home/ubuntu/Cheetah"
cd "$PROJECT_DIR"

echo "Checking for updates..."

git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

# Nothing new → exit early
if [ "$LOCAL" = "$REMOTE" ]; then
    echo "No new commits. Exiting."
    exit 0
fi

echo "New changes detected. Deploying..."

# Pull latest code
git pull origin main

# Stop old app
echo "Stopping running server..."
bash ./prodstop.sh

# Start app (build frontend + backend + PM2)
echo "Starting server..."
bash ./prodstart.sh

echo "Deployment complete"
