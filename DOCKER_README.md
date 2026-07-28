# Running Western Agro CRM with Docker

This repository includes a robust Docker Compose setup designed to make local development and onboarding completely foolproof. You do not need to install Node.js, MySQL, or LibreOffice on your host machine.

## Prerequisites
1. **Docker Desktop**: Download and install it from [docker.com](https://www.docker.com/products/docker-desktop).
2. **System Resources (Windows/Mac)**: LibreOffice conversion requires adequate memory. We recommend allocating at least **4GB of RAM** to Docker Desktop in your Docker settings to prevent silent out-of-memory crashes.

## Quick Start
1. Ensure Docker Desktop is running.
2. If you are on Windows, double-click **`start.bat`**.
3. If you are on Mac/Linux, run `bash start.sh`.

> **Note on First Build Time:** The backend container installs a full headless LibreOffice suite to power the Tagless Document Engine. **The very first time you run the start script, the build may take 10-15 minutes.** This is normal. Please do not cancel the script, or it will corrupt the Docker cache.

## Port Collisions
If you already have services running on ports 3306, 5000, 3000, or 5173 on your machine, Docker will fail to bind. 
To fix this:
1. Open `.env` (it was auto-created from `.env.example`).
2. Change `HOST_DB_PORT`, `HOST_BACKEND_PORT`, etc., to an available port.
3. Run the start script again.

> **Warning for Frontend Ports:** The React and Vite apps bake their API URLs in at build time. If you change `HOST_BACKEND_PORT` after you have already built the containers once, you MUST run `docker-compose up -d --build` to force the frontends to re-read the new environment variables.

## Resetting the Database
The massive SQL dump (`crm_jot_backup_utf8.sql`) is automatically imported the very first time the database container boots. 
If you mess up your database and want to start fresh from the dump:
- Run `bash reset-db.sh` (or double-click `reset-db.bat`).
- This will safely delete the MySQL data volume *without* deleting your uploaded PDF documents.
- Run `start.sh` or `start.bat` again, and the dump will re-import.
