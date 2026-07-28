# Deployment Guide — CRM JOT

This guide covers all deployment scenarios: local Docker (recommended), manual development setup, and production server deployment.

---

## Option 1: Docker (Recommended for All Users)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- 8 GB RAM, 10 GB disk space

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ujjwal200629/C_R_M.git
cd C_R_M

# 2. Start everything with one command
#    Windows: double-click start.bat
#    Mac/Linux:
bash start.sh
```

**First run:** 10–15 minutes (downloads Docker images and builds the app)  
**Subsequent runs:** Under 30 seconds

Access the app at: **http://localhost:5000**  
Login: `admin` / `12345`

---

## Option 2: Manual Development Setup (Developers Only)

Use this if you want to develop and make code changes without Docker.

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | v18 or higher |
| MySQL | v8.0 or higher |
| LibreOffice | Latest (for PDF generation) |

### Steps

#### 1. Set Up the Database
```sql
-- In MySQL Workbench or terminal:
CREATE DATABASE crm_jot;

-- Then import the schema:
mysql -u root -p crm_jot < schema.sql
```

#### 2. Configure the Backend
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crm_jot
PORT=5000
JWT_SECRET=your_secret_key_here
```

#### 3. Install Dependencies and Start Backend
```bash
cd backend
npm install
npm start
```

Backend API is now running at **http://localhost:5000**

#### 4. Install Dependencies and Start CRM Frontend
Open a **new terminal**:
```bash
cd backend/crm-jot-frontend
npm install
npm start
```

CRM frontend is now at **http://localhost:3000**

#### 5. Install Dependencies and Start DocPlatform Frontend
Open another **new terminal**:
```bash
cd docplatform-frontend
npm install
npm run dev
```

DocPlatform is now at **http://localhost:5173**

---

## Option 3: Production Server Deployment (Linux VPS)

Use this to deploy the CRM on a cloud server (AWS, DigitalOcean, etc.).

### Prerequisites on the Server
- Ubuntu 20.04 or higher
- Docker and Docker Compose installed
- A domain name (optional but recommended)

### Install Docker on Ubuntu
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to the docker group (avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Deploy the Application
```bash
# Clone the repository on your server
git clone https://github.com/ujjwal200629/C_R_M.git
cd C_R_M

# Create your environment file
cp .env.example .env
# Edit .env with a strong DB password:
nano .env

# Start the application in the background
docker compose up -d --build
```

### Verify It's Running
```bash
docker compose ps
# Both 'db' and 'backend' should show as 'Up' or 'healthy'

# Check backend logs
docker compose logs backend --tail 20
```

Access at: **http://YOUR_SERVER_IP:5000**

### Setting Up a Domain with Nginx (Optional)

Install Nginx:
```bash
sudo apt-get install nginx
```

Create a site config `/etc/nginx/sites-available/crm`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Enable HTTPS with Let's Encrypt (Optional)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Keeping the App Updated

When there are new changes on GitHub:

```bash
# Pull the latest code
git pull origin main

# Rebuild and restart the containers
docker compose up -d --build
```

---

## Backup & Restore

### Backup the Database
```bash
docker exec crm_db mysqldump -u root -proot crm_jot > backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
docker exec -i crm_db mysql -u root -proot crm_jot < backup_20240101.sql
```

### Backup Uploaded Files
Uploaded files are stored in a Docker volume. To back them up:
```bash
docker run --rm -v crm_jot_backend_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_backup.tar.gz -C /data .
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `DB_PASSWORD` | `root` | MySQL root password |
| `DB_NAME` | `crm_jot` | MySQL database name |
| `HOST_DB_PORT` | `3306` | Port to expose MySQL on the host |
| `HOST_BACKEND_PORT` | `5000` | Port to expose the app on the host |

---

## Container Logs & Debugging

```bash
# View backend logs (live)
docker compose logs -f backend

# View database logs
docker compose logs -f db

# Get a shell inside the backend container
docker exec -it crm_backend bash

# Get a MySQL shell inside the database container
docker exec -it crm_db mysql -u root -proot crm_jot

# Restart only the backend
docker compose restart backend

# Stop everything and remove containers (keeps data)
docker compose down

# Stop everything and DELETE all data (full reset)
docker compose down -v
```
