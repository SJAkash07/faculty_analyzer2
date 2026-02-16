#!/bin/bash
set -e

echo "Starting Faculty Analyzer on Render..."
echo "PORT: $PORT"
echo "Current directory: $(pwd)"

# Navigate to app directory
cd Publication_Analyzer/Publication_Analyzer

echo "App directory: $(pwd)"
echo "Contents:"
ls -la

# Start the application
exec gunicorn backend.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT}" \
  --timeout 120 \
  --workers 1 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
