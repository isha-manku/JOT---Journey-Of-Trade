# CRM JOT — Enterprise CRM System

A complete CRM with buyer/seller management, inquiry tracking, document generation, accounts ledger, and BI dashboards.

---

## 📖 How to Run This Project

Choose one of the three options based on your goal:

| I want to... | Use this option |
|---|---|
| Run it on my computer (easiest) | [Option 1 — Docker](#option-1--run-locally-using-docker-recommended) |
| Run it manually without Docker | [Option 2 — Manual Setup](#option-2--run-manually-without-docker) |
| Make it live on the internet | [Option 3 — Deploy on Railway](#option-3--deploy-globally-on-railway) |

---

## Option 1 — Run Locally Using Docker (Recommended)

> **This is the simplest method. You only need to install one thing: Docker Desktop.**  
> No Node.js, MySQL, or any other tool required.

### Step 1 — Install Docker Desktop

Download from: **https://www.docker.com/products/docker-desktop**

Install it and **restart your computer** after installation.

**System requirements:**
- Windows 10 or 11 (64-bit)
- At least 8 GB RAM
- At least 10 GB free disk space

---

### Step 2 — Download This Project

**Option A — Using Git:**
```bash
git clone https://github.com/ujjwal200629/C_R_M.git
cd C_R_M
```

**Option B — Download ZIP:**
1. Go to https://github.com/ujjwal200629/C_R_M
2. Click the green **"Code"** button → **"Download ZIP"**
3. Extract the ZIP and open the folder

---

### Step 3 — Start the Application

**Windows:** Double-click the `start.bat` file inside the folder.

**Mac / Linux:** Open Terminal inside the folder and run:
```bash
bash start.sh
```

A terminal window will open and start building everything automatically.

> ⏳ **First run takes 10–15 minutes** — Docker downloads and builds the entire application.  
> This only happens once. After that, it starts in under 30 seconds.  
> **Do not close the terminal while it is running.**

---

### Step 4 — Open the App

When the build is complete, your browser will open automatically at:

> **http://localhost:5000**

**Login credentials:**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `12345` |

---

### Stopping the App

Open a terminal in the project folder and run:
```bash
docker compose down
```
Or open Docker Desktop → find the project → click the **Stop** button.

---

### Restarting After a Stop

Just double-click `start.bat` again. It will start in under 30 seconds this time.

---

### Port Conflict Fix

If you get an error saying port 5000 is already in use:
1. Create a file named `.env` in the project folder
2. Add this line inside it:
   ```
   HOST_BACKEND_PORT=5001
   ```
3. Run `start.bat` again — the app will now be at **http://localhost:5001**

---

### Resetting the Database (Wipe All Data)

**Windows:** Double-click `reset-db.bat`, then run `start.bat` again.  
**Mac/Linux:** Run `bash reset-db.sh`, then `bash start.sh` again.

---

### Troubleshooting (Docker)

| Problem | Solution |
|---|---|
| "Docker is not installed" | Install Docker Desktop from https://www.docker.com/products/docker-desktop |
| Build fails or times out | Check your internet connection and run `start.bat` again — it resumes from cache |
| Browser opens but page is blank or shows error | Wait 30 seconds and refresh the page |
| "Port already in use" | See Port Conflict Fix above |
| App is very slow | Open Docker Desktop → Settings → Resources → increase Memory to at least 4 GB |
| Containers keep restarting | Open Docker Desktop → click the `backend` container → view logs to see the error |

---
---

## Option 2 — Run Manually Without Docker

> Use this if you are a developer and want to run or modify the code directly on your machine without Docker.

### Prerequisites

Install all of the following before starting:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | https://nodejs.org |
| **MySQL** | v8.0 or higher | https://dev.mysql.com/downloads/ |
| **Git** | Any | https://git-scm.com |
| **LibreOffice** | Latest | https://www.libreoffice.org (needed for PDF generation only) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/ujjwal200629/C_R_M.git
cd C_R_M
```

---

### Step 2 — Set Up the Database

Open MySQL Workbench, DBeaver, or your terminal and run:

```sql
CREATE DATABASE crm_jot;
```

Then import the schema:
```bash
mysql -u root -p crm_jot < schema.sql
```

---

### Step 3 — Configure the Backend

```bash
cd backend
```

Create a `.env` file inside the `backend` folder with this content:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=crm_jot
DB_PORT=3306
PORT=5000
JWT_SECRET=any_random_long_string_here
```

---

### Step 4 — Install and Start the Backend

```bash
# Inside the /backend folder
npm install
npm start
```

You should see:
```
🚀 Server running on port 5000
MySQL Connected successfully.
✅ Users table ready
✅ All tables ready
```

The backend API is now running at **http://localhost:5000**

---

### Step 5 — Install and Start the CRM Frontend

Open a **new terminal window:**

```bash
cd backend/crm-jot-frontend
npm install
npm start
```

The CRM app will open automatically at **http://localhost:3000**

---

### Step 6 (Optional) — Start the Document Platform Frontend

Open another **new terminal window:**

```bash
cd docplatform-frontend
npm install
npm run dev
```

The Document Platform will be at **http://localhost:5173**

---

### Login Credentials

| Username | Password |
|---|---|
| `admin` | `12345` |

---

### Troubleshooting (Manual)

| Problem | Solution |
|---|---|
| `npm install` fails | Make sure Node.js v18+ is installed: run `node -v` to check |
| MySQL connection error | Make sure MySQL is running and the password in `.env` is correct |
| Port 5000 already in use | Change `PORT=5000` to `PORT=5001` in `backend/.env` |
| PDF generation not working | Make sure LibreOffice is installed and accessible in your system PATH |

---
---

## Option 3 — Deploy Globally on Railway

> Use this to make the CRM accessible on the internet from any device, anywhere in the world.

[Railway](https://railway.app) is a cloud hosting platform. The CRM is deployed as a single Docker container with a Railway-managed MySQL database.

> ⚠️ **Important about cost:**  
> The app includes LibreOffice for document generation which requires memory.  
> Railway's **free tier (512 MB RAM) is not enough**.  
> You need the **Hobby plan (~$5/month)** or higher.

---

### Step 1 — Create a Railway Account

Go to **https://railway.app** and sign up using your GitHub account.

---

### Step 2 — Create a New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account when prompted
4. Select the **`C_R_M`** repository
5. Railway will automatically detect the `Dockerfile` — no extra configuration needed

---

### Step 3 — Add a MySQL Database

Inside your Railway project dashboard:

1. Click **"New"** → **"Database"** → **"MySQL"**
2. Wait ~30 seconds for it to provision
3. Click on the MySQL service → **"Variables"** tab
4. Note these 5 values — you will need them in the next step:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

---

### Step 4 — Configure Environment Variables

Click on your **backend service** (the one built from the GitHub repo) → **"Variables"** tab → add each of these:

| Variable Name | What to put |
|---|---|
| `DB_HOST` | Paste the value of `MYSQLHOST` from your Railway MySQL service |
| `DB_USER` | Paste the value of `MYSQLUSER` |
| `DB_PASSWORD` | Paste the value of `MYSQLPASSWORD` |
| `DB_NAME` | Paste the value of `MYSQLDATABASE` |
| `DB_PORT` | Paste the value of `MYSQLPORT` (usually `3306`) |
| `PORT` | `5000` |
| `JWT_SECRET` | Type any long random string, e.g. `my_super_secret_crm_key_2024` |

> 💡 **Tip:** Instead of copying values manually, click **"Add Reference"** when setting each DB variable — Railway will let you directly link it from the MySQL service.

---

### Step 5 — Import the Database Schema

Railway's MySQL database starts empty — you need to import the schema once.

**Easiest method — Using a free MySQL GUI (MySQL Workbench / DBeaver / TablePlus):**

1. Go to your MySQL service in Railway → **"Connect"** tab
2. Copy the connection details shown there
3. Open your MySQL GUI and create a new connection using those details
4. Once connected, go to **File → Run SQL Script** (or equivalent)
5. Select the `schema.sql` file from this project
6. Run it — all tables will be created

**Alternative — Using Railway's built-in shell:**
1. Go to the MySQL service → **"Connect"** tab → click **"Open in MySQL Shell"** (if available)
2. Paste the contents of `schema.sql` and execute

---

### Step 6 — Verify the Dockerfile is Being Used

Go to your backend service → **"Settings"** → **"Build"** and confirm:
- **Builder:** `Dockerfile`
- **Dockerfile Path:** `./Dockerfile`

If Railway is using a different builder, change it to Dockerfile and redeploy.

---

### Step 7 — Get Your Public URL

Once deployed and showing a green status:

1. Go to your backend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** if no URL exists yet
3. Copy your public URL — it will look like:
   ```
   https://c-r-m-production.up.railway.app
   ```
4. Open it in your browser — you should see the CRM login page

**Login:** `admin` / `12345`

---

### Railway Deployment Checklist

Use this to make sure you haven't missed anything:

- [ ] Railway account created
- [ ] Project created from the `C_R_M` GitHub repo
- [ ] MySQL database added to the project
- [ ] All 7 environment variables set on the backend service
- [ ] `schema.sql` imported into the Railway MySQL database
- [ ] Dockerfile builder confirmed in service settings
- [ ] Service shows green (deployed successfully)
- [ ] Public domain generated
- [ ] Opened the URL and logged in with `admin` / `12345`

---

### Railway Troubleshooting

| Problem | Solution |
|---|---|
| Build fails | Go to service → "Deployments" → click the failed deployment to see logs |
| App loads but can't connect to DB | Double-check all `DB_*` environment variables are correct |
| "Cannot GET /" error | The build may have failed — check deployment logs |
| App crashes immediately | RAM is too low — upgrade Railway plan to Hobby or higher |
| Login doesn't work | Make sure `schema.sql` was imported — the `users` table must exist |

---

### Railway Plan Costs

| Plan | RAM | Monthly Cost | Suitable? |
|---|---|---|---|
| Free | 512 MB | $0 | ❌ Too low — app will crash |
| Hobby | 1 GB | ~$5 | ✅ Minimum for this app |
| Pro | 2 GB+ | ~$10–20 | ✅ Best for production use |

> MySQL database storage costs an additional ~$1–5/month depending on data size.

---
---

## 🔑 Default Login Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `12345` | Full access |

Change the password immediately after first login via **Settings → User Management**.

---

## 📞 Support & Logs

If something isn't working, the first step is always to check the logs:

**Docker:**
```bash
docker compose logs backend
docker compose logs db
```

**Railway:** Go to your service → "Deployments" → click the deployment → view logs.
