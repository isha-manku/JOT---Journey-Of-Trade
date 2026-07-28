# CRM JOT — Quick Start Guide

## What You Need (Prerequisites)

1. **Docker Desktop** (the only thing you need to install)
   - Download from: https://www.docker.com/products/docker-desktop
   - Install it and restart your computer after installation.

2. **System Requirements**
   - Windows 10 or 11 (64-bit)
   - At least **8 GB RAM** on the machine
   - At least **10 GB free disk space** (for Docker images)

---

## How to Start the Application

1. **Open the folder** where you cloned or extracted this project.
2. **Double-click `start.bat`**.
3. **Wait** — the first run downloads and builds everything automatically. This takes **10–15 minutes** the first time only. After that, it starts in under 30 seconds.
4. When done, your browser will **open automatically** at `http://localhost:5000`.

**Login credentials:**
- Username: `admin`
- Password: `12345`

> **Do not close the terminal window** while the first build is running.

---

## Stopping the Application

To stop the application, open a terminal in this folder and run:
```
docker compose down
```

---

## Resetting the Database (Fresh Start)

If you want to wipe all data and start fresh:
- **Windows:** Double-click `reset-db.bat`
- Then run `start.bat` again.

---

## Port Conflict Fix

If you get an error about port 5000 already being in use:
1. Create a file named `.env` in this folder.
2. Add the line: `HOST_BACKEND_PORT=5001`
3. Run `start.bat` again and access the app at `http://localhost:5001`.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Docker is not installed" | Install Docker Desktop from the link above |
| Build takes too long or fails | Make sure you have a stable internet connection during first run |
| Browser opens but shows error | Wait 30 more seconds and refresh — the server is still warming up |
| "Port already in use" | See Port Conflict Fix above |
| App is slow or crashes | Open Docker Desktop → Settings → Resources → Give it at least 4 GB RAM |
