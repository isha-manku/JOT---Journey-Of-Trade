@echo off
setlocal enabledelayedexpansion

echo [WARNING] This will permanently delete the local database volume.
echo Uploaded documents will be preserved.
set /p "confirm=Are you sure you want to reset the database? [y/N] "
if /i not "!confirm!"=="y" (
    echo Aborted.
    exit /b 0
)

echo Stopping database container...
docker-compose stop db
echo Removing database container and its volume...
docker-compose rm -f -v db
echo Done. The next time you run start.bat, the database will be re-initialized from the SQL dump.
