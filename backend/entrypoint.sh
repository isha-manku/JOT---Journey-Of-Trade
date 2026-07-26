#!/bin/bash
set -e

echo "Starting LibreOffice Headless Daemon as a background service..."

# Start LibreOffice in headless listener mode on port 2002
# The unoconv script connects to this socket automatically.
soffice --headless --accept="socket,host=127.0.0.1,port=2002;urp;" --nofirststartwizard &

# Wait for the socket to become available
sleep 3
echo "LibreOffice daemon started."

# Execute the main Node.js application
echo "Starting Node server..."
exec npm start
