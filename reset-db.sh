#!/bin/bash
set -e

echo "⚠️  WARNING: This will permanently delete the local database volume."
echo "Uploaded documents will be preserved."
read -p "Are you sure you want to reset the database? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Stopping database container..."
    docker-compose stop db
    echo "Removing database container and its volume..."
    docker-compose rm -f -v db
    echo "Done. The next time you run start.sh, the database will be re-initialized from the SQL dump."
else
    echo "Aborted."
fi
