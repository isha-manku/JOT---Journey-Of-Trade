# 🌾 WESTERN AGRO CRM

A full-stack **Commodity Trading CRM** built for import/export, logistics, and brokerage businesses.  
Features a **Business Intelligence Dashboard**, financial ledger, commission tracking, buyer/seller management, and route analytics.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up MySQL Database](#2-set-up-mysql-database)
  - [3. Configure Backend Environment](#3-configure-backend-environment)
  - [4. Run the Backend](#4-run-the-backend)
  - [5. Run the Frontend](#5-run-the-frontend)
- [Project Structure](#project-structure)
- [Features](#features)
- [Default Login](#default-login)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Create React App) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |
| **Charts** | Recharts |
| **Icons** | React Icons (Feather) |
| **Docs** | docxtemplater + pizzip |

---

## ✅ Prerequisites

Make sure the following are installed on the target system:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | https://nodejs.org |
| **MySQL** | v8.0 or higher | https://dev.mysql.com/downloads/ |
| **Git** | Any recent | https://git-scm.com |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ujjwal200629/WESTERN-AGRO-CRM.git
cd WESTERN-AGRO-CRM
```

---

### 2. Set Up MySQL Database

Open your MySQL client (MySQL Workbench, terminal, etc.) and run:

```sql
CREATE DATABASE crm_jot;
```

> The backend will automatically create all tables on first run — no SQL schema file needed.

---

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Now open `backend/.env` and fill in your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=crm_jot
PORT=5000
```

> ⚠️ Replace `your_mysql_password_here` with your actual MySQL root password.

---

### 4. Run the Backend

```bash
# Inside the /backend folder
npm install
node server.js
```

You should see:
```
🚀 Server running on port 5000
MySQL Connected
✅ Users table ready
✅ ...all tables ready
```

> The backend runs on **http://localhost:5000**

---

### 5. Run the Frontend

Open a **new terminal window**:

```bash
cd backend/crm-jot-frontend
npm install
npm start
```

The browser will automatically open at **http://localhost:3000**

> ⏳ First `npm install` may take 1–2 minutes to download all dependencies.

---

## 📁 Project Structure

```
WESTERN-AGRO-CRM/
├── backend/
│   ├── server.js              # Express server + all API routes
│   ├── accounts_router.js     # Accounts & BI dashboard API
│   ├── db.js                  # MySQL connection
│   ├── setup_accounts.js      # Database table initializer
│   ├── .env.example           # Environment variable template
│   ├── package.json
│   ├── templates/             # Word document templates
│   ├── uploads/               # Uploaded files (auto-created)
│   └── crm-jot-frontend/      # React frontend
│       ├── src/
│       │   ├── App.js
│       │   ├── pages/
│       │   │   ├── Accounts.js
│       │   │   ├── AccountsDashboard.js   # BI Dashboard
│       │   │   ├── BuyerDashboard.js
│       │   │   ├── SellerDashboard.js
│       │   │   ├── ProductDashboard.js
│       │   │   ├── CompanyDashboard.js
│       │   │   ├── PortDashboard.js
│       │   │   ├── Buyers.js
│       │   │   ├── Sellers.js
│       │   │   ├── Companies.js
│       │   │   ├── Inquiries.js
│       │   │   ├── Dashboard.js
│       │   │   └── ...
│       │   └── index.js
│       └── package.json
```

---

## ✨ Features

### 👥 CRM Core
- Buyer & Seller management with documents
- Company management
- Inquiry & follow-up tracking
- Calendar & task scheduling
- Messaging system

### 💰 Accounts Module
- Financial transaction ledger
- Admin/Manager role-based access
- Cost price, selling price, margin, net profit tracking
- Commission mandate management (IMPFA)
- Transaction lock on completion
- Soft-delete / cancel with audit trail

### 📊 BI Dashboard (Admin Only)
- **Executive KPI cards** — Revenue, Profit, Margin, Commission
- **Monthly trends** — Area charts with Recharts
- **Client Intelligence** — Buyer & Seller drilldowns
- **Product Intelligence** — Top products by profit & tonnage
- **Route Analytics** — Most profitable trade routes
- **Supplier × Product Matrix** — Company performance
- **Port Intelligence** — Loading & destination port rankings
- **Global filters** — Date range, buyer, seller, product, port, payment mode
- **CSV Export** & **PDF Print** with filter metadata

### 🔐 Role-Based Access
| Feature | Admin | Manager |
|---|---|---|
| View Accounts Ledger | ✅ | ❌ |
| BI Dashboard | ✅ | ❌ |
| Create Transactions | ✅ | ✅ |
| See Cost Price / Margin | ✅ | ❌ |
| Complete Transactions | ✅ | ❌ |

---

## 🔑 Default Login

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | *(set during first run or via Settings)* |
| **Manager** | `manager` | *(set during first run or via Settings)* |

> User accounts are managed in the **Settings** page by Admin.

---

## 🌐 Ports

| Service | URL |
|---|---|
| Backend API | http://localhost:5000 |
| Frontend App | http://localhost:3000 |

---

## 📝 Notes

- **MySQL must be running** before starting the backend.
- The backend **auto-creates all database tables** on first start — no manual SQL import needed.
- The `uploads/` and `node_modules/` folders are excluded from the repository.
- Never commit your `.env` file — it contains your database password.
