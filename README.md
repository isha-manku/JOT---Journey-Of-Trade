# CRM JOT — Enterprise CRM System

A full-featured CRM application with buyer/seller management, inquiry tracking, document generation, accounts ledger, BI dashboards, and more. Deployable with a single click using Docker.

---

## 🚀 Quick Start (Recommended — Docker)

**The only thing you need is Docker Desktop. No Node.js, MySQL, or any other software required.**

### Step 1 — Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop  
Restart your computer after installation.

### Step 2 — Clone or Download the Repository
```bash
git clone https://github.com/ujjwal200629/C_R_M.git
cd C_R_M
```
Or download the ZIP from GitHub and extract it.

### Step 3 — Run the Application
**Windows:** Double-click `start.bat`

**Mac / Linux:** Open terminal and run:
```bash
bash start.sh
```

### Step 4 — Open the App
The browser will open automatically at:
> **http://localhost:5000**

**Default Login:**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `12345` |

> ⏳ **First run takes 10–15 minutes** — Docker downloads and builds everything automatically. Subsequent starts take under 30 seconds.

---

## 🛑 Stopping the Application

```bash
docker compose down
```

Or open Docker Desktop → find the `c_r_m` stack → click the Stop button.

---

## 🔄 Resetting the Database

To wipe all data and start fresh from a clean database:

**Windows:** Double-click `reset-db.bat`  
**Mac/Linux:** `bash reset-db.sh`

Then run `start.bat` again.

---

## ⚙️ System Requirements

| Requirement | Minimum |
|---|---|
| OS | Windows 10/11, macOS 11+, Ubuntu 20.04+ |
| RAM | 8 GB (4 GB allocated to Docker) |
| Disk Space | 10 GB free |
| Internet | Required for first build only |

---

## 🔧 Port Conflict Fix

If port 5000 is already in use on your machine:

1. Create a file named `.env` in the project root folder.
2. Add this line:
   ```
   HOST_BACKEND_PORT=5001
   ```
3. Run `start.bat` again and open **http://localhost:5001**.

---

## 🗂️ Project Structure

```
C_R_M/
├── start.bat                  # One-click Windows startup
├── start.sh                   # One-click Mac/Linux startup
├── reset-db.bat               # Windows database reset
├── reset-db.sh                # Mac/Linux database reset
├── docker-compose.yml         # Docker service definitions
├── Dockerfile                 # Multi-stage build (frontend + backend)
├── schema.sql                 # Database schema (auto-imported on first run)
├── .env.example               # Environment variable template
├── backend/
│   ├── server.js              # Express API server
│   ├── accounts_router.js     # Accounts & BI dashboard API
│   ├── settings_router.js     # Settings & document template API
│   ├── documentHydrator.service.js  # DOCX generation engine
│   ├── entrypoint.sh          # Container startup script
│   ├── crm-jot-frontend/      # React CRM frontend
│   └── uploads/               # Uploaded files (persisted via Docker volume)
└── docplatform-frontend/      # Document platform frontend (Vite/React)
```

---

## ✨ Features

### CRM Core
- **Buyer & Seller Management** — full profiles, documents, history
- **Company & Product Management**
- **Inquiry & Follow-up Tracking** — with status pipeline
- **Calendar & Task Scheduling**
- **Messaging System** — internal notifications
- **Document Engine** — upload `.docx` templates, map fields, generate filled documents

### Accounts Module
- Financial transaction ledger
- Cost price, selling price, margin, net profit tracking
- Commission mandate management (IMPFA)
- Transaction lock on completion
- Soft-delete / cancel with full audit trail
- Admin/Manager role-based access control

### BI Dashboard (Admin Only)
- Executive KPI cards — Revenue, Profit, Margin, Commission
- Monthly trend charts (area charts)
- Buyer & Seller intelligence drilldowns
- Product intelligence — top products by profit & tonnage
- Route analytics — most profitable trade routes
- Port intelligence — loading & destination port rankings
- Global filters — date range, buyer, seller, product, port, payment mode
- CSV Export & PDF Print

### Role-Based Access
| Feature | Admin | Manager |
|---|---|---|
| View Accounts Ledger | ✅ | ❌ |
| BI Dashboard | ✅ | ❌ |
| Create Transactions | ✅ | ✅ |
| See Cost Price / Margin | ✅ | ❌ |
| Complete Transactions | ✅ | ❌ |

---

## 🐳 Docker Architecture

The application runs as two Docker containers managed by Docker Compose:

| Container | Role | Port |
|---|---|---|
| `db` | MySQL 8.0 database | 3306 (internal) |
| `backend` | Node.js API + React frontend + LibreOffice | 5000 |

Everything is served through a **single port (5000)**:
- `http://localhost:5000` → CRM Frontend (React)
- `http://localhost:5000/docplatform` → Document Platform Frontend
- `http://localhost:5000/api/...` → REST API

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the project root to customize:

```env
# Database credentials
DB_PASSWORD=root
DB_NAME=crm_jot

# Change these if you have port conflicts
HOST_DB_PORT=3306
HOST_BACKEND_PORT=5000
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| "Docker is not installed" | Install Docker Desktop from https://www.docker.com/products/docker-desktop |
| First build fails | Check internet connection. Run `start.bat` again — it resumes from cache |
| Browser shows "Cannot GET /" | Wait 30 seconds and refresh — server is still warming up |
| "Port already in use" | See Port Conflict Fix section above |
| App is very slow | Open Docker Desktop → Settings → Resources → set Memory to at least 4 GB |
| Login not working | Use `admin` / `12345` (default credentials) |
| Database has no data | Run `reset-db.bat` then `start.bat` again to re-import the schema |
| Container keeps restarting | Run `docker compose logs backend` in terminal to see the error |

---

## 📞 Support

For deployment issues, check the container logs:
```bash
docker compose logs backend
docker compose logs db
```
