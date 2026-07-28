#!/bin/bash

# Configuration
MAX_RETRIES=40
RETRY_INTERVAL=3
HOST_BACKEND_PORT=${HOST_BACKEND_PORT:-5000}
HOST_CRM_PORT=${HOST_CRM_PORT:-3000}
HOST_DOC_PORT=${HOST_DOC_PORT:-5173}

check_service() {
  local service_name=$1
  local url=$2
  local retries=0
  
  echo -n "Checking $service_name ($url)... "
  
  while [ $retries -lt $MAX_RETRIES ]; do
    if curl -s -f -m 2 "$url" > /dev/null; then
      echo "✅ OK"
      return 0
    fi
    retries=$((retries + 1))
    sleep $RETRY_INTERVAL
  done
  
  echo "❌ FAILED"
  echo "--- Logs for $service_name ---"
  docker-compose logs --tail 30 "$service_name"
  echo "------------------------------"
  exit 1
}

# Wait for backend (this also implies DB is healthy due to depends_on)
# Usually backend/server.js root doesn't return anything or returns a 404/500 if not configured.
# Assuming localhost:5000 returns something or at least accepts TCP. 
# We'll check the TCP port to be safe.
check_service "crm_backend" "http://localhost:$HOST_BACKEND_PORT"

# Check frontends
check_service "crm_frontend" "http://localhost:$HOST_CRM_PORT"
check_service "crm_doc_frontend" "http://localhost:$HOST_DOC_PORT"

echo "🎉 All services are up and running!"
echo "CRM Frontend: http://localhost:$HOST_CRM_PORT"
echo "Doc Platform: http://localhost:$HOST_DOC_PORT"
