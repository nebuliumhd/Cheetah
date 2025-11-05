#!/bin/bash

echo "Stopping PM2 server..."
sudo pm2 stop chetchat
sudo pm2 delete chetchat