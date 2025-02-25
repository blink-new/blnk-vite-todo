#!/bin/bash

# This script runs during building the sandbox template
# and makes sure the Vite app and Hono API are running

function check_health() {
  local url=$1
  local max_attempts=50
  local attempt=1
  local wait_time=2

  echo "Checking health for $url..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s "$url" > /dev/null; then
      echo "Service at $url is up!"
      return 0
    fi
    
    echo "Attempt $attempt/$max_attempts: Service at $url is not ready yet..."
    sleep $wait_time
    attempt=$((attempt + 1))
  done

  echo "Service at $url failed to start after $max_attempts attempts"
  return 1
}

# Start servers using Turborepo
cd /home/user
echo "Starting development servers..."

# Start both services in parallel but capture their output
turbo run dev --parallel --filter=web --filter=api 2>&1 &
TURBO_PID=$!

# Check if services are healthy
check_health "http://localhost:3000" &
WEB_HEALTH_PID=$!

check_health "http://localhost:3001/api/health" &
API_HEALTH_PID=$!

# Wait for health checks
wait $WEB_HEALTH_PID
WEB_STATUS=$?

wait $API_HEALTH_PID
API_STATUS=$?

# If either health check failed, kill turbo and exit
if [ $WEB_STATUS -ne 0 ] || [ $API_STATUS -ne 0 ]; then
  echo "One or more services failed to start properly"
  kill $TURBO_PID
  exit 1
fi

# Keep the container running with turbo
wait $TURBO_PID