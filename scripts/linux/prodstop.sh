#!/bin/bash

echo "Stopping PM2 server..."
sudo pm2 stop my-app
sudo pm2 delete my-app