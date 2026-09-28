# SSGMCE Teacher Attendance ERP Portal - Backend API

Production-ready backend API service for **Shri Sant Gajanan Maharaj College of Engineering, Shegaon (SSGMCE)** Teacher Attendance ERP Portal.

Built with **Node.js (v20+)**, **Express.js**, **PostgreSQL**, and **Prisma ORM**, providing secure, scalable attendance tracking, faculty class management, and institutional reporting.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ / ES Modules) | High performance asynchronous I/O |
| **Framework** | Express.js | Industry-standard REST routing |
| **Database** | PostgreSQL 16 | ACID compliant relational persistence |
| **ORM** | Prisma 5.20+ | Type-safe migrations, seeding & relations |
| **Security** | Helmet, CORS, JWT, Bcrypt | Defense-in-depth protection |
| **Auth** | Dual JWT (Access 15m + Refresh 7d) | Secure stateless token authentication |
| **Validation** | Zod | Runtime schema validation |
| **Caching** | Redis (with in-memory fallback) | Session cache & token blacklisting |
| **Logging** | Winston & Morgan | Structured JSON logging with stream output |
| **Container** | Docker & Docker Compose | Multi-container reproducible deployment |

---

## 🔐 Demo Credentials

The database seed provides preconfigured credentials for testing and evaluation:

| Role | Employee Code / Username | Email | Password | Full Name |
| :--- | :--- | :--- | :--- | :--- |
| **Teaching Assistant** | `1039226014` | `kulthe.kv@ssgmce.ac.in` | `Demo@123` | Mr. K.V. Kulthe |
| **Associate Professor** | `EMP-CSE-1042` | `rajesh.sharma@ssgmce.ac.in` | `Demo@123` | Prof. Rajesh Sharma |
| **HOD (CSE)** | `EMP-CSE-HOD` | `hod.cse@ssgmce.ac.in` | `Demo@123` | Dr. S. B. Somani |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+ and npm installed
- PostgreSQL 16 running locally (or via Docker)
- Redis (optional, app automatically falls back to in-memory cache)

---

### Method A: Docker Compose (Recommended - Zero Setup)

Run PostgreSQL, Redis, and the Backend API simultaneously:

```bash
cd faculty_attendence/backend
docker-compose up --build -d
```

Run seed inside container:
```bash
docker-compose exec backend npm run seed
```

The API will be live at `http://localhost:5000` with the health check at `http://localhost:5000/health`.

---

### Method B: Local Development

1. **Install dependencies:**
   ```bash
   cd faculty_attendence/backend
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` points to your PostgreSQL instance.

3. **Run Prisma Migrations & Generate Client:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Seed Database:**
   ```bash
   npm run seed
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

The server starts at `http://localhost:5000`.

---

## 📡 API Reference & Standard Envelope

All API endpoints follow a standardized response envelope.

### Success Response
```json
{
  "success": true,
  "message": "Human readable confirmation",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descriptive error message",
    "details": [ ... ]
  }
}
```

---

## 🧪 Testing & Postman

### Running Automated Tests
```bash
cd faculty_attendence/backend
npm test
```

### Postman Collection
Import `faculty_attendence/backend/SSGMCE-ERP.postman_collection.json` into Postman.
- Configured with automated script handlers: Logging in automatically captures the Bearer JWT and sets `{{accessToken}}` across all subsequent requests.
