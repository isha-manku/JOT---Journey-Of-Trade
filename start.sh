#!/bin/bash
set -e

echo "======================================"
echo "    Western Agro CRM - Local Start    "
echo "======================================"

# 1. Preflight check: Is Docker running?
if ! docker info > /dev/null 2>&1; then
  echo "❌ ERROR: Docker is not running or not installed."
  echo "Please start Docker Desktop and try again."
  exit 1
fi
echo "✅ Docker is running."

# 2. Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
fi

# 3. Handle --reset flag
if [ "$1" == "--reset" ]; then
  echo "⚠️  Resetting Database Volume..."
  docker-compose down -v db_data
fi

# 4. Start the stack
echo "🚀 Starting Docker Compose environment..."
echo "Note: The first build may take 10-15 minutes (LibreOffice installation). Please be patient."
docker-compose up -d --build

# 5. Run Verification
echo "⏳ Waiting for services to initialize..."
bash ./verify.sh
