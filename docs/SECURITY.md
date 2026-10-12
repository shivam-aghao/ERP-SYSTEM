# SSGMCE College ERP — Security Specification & Secrets Management Guide

## 1. Executive Summary & Incident Remediation

This security document outlines the credentials management, encryption standards, and threat prevention architecture for the **Shri Sant Gajanan Maharaj College of Engineering (SSGMCE)** Autonomous College Enterprise Resource Planning (ERP) System.

### Remediation of Exposed Credentials (CRITICAL)
During an automated codebase security audit, an exposed Supabase `service_role` key and database passwords were identified in plaintext files within the repository (`supabase_keys.json`, `backend/config/settings.py`, and `supabase/functions/cleanup-expired-quizzes/index.ts`).

The following remediation actions were executed immediately:
1. **Permanent File Deletion & Untracking:** `supabase/scripts/supabase_keys.json` was purged from the filesystem and untracked from Git using `git rm -f`.
2. **Elimination of Source-Code Fallbacks:** All hardcoded fallback secrets in `backend/config/settings.py`, `backend/main.py`, `supabase/functions/cleanup-expired-quizzes/index.ts`, and helper scripts were completely removed.
3. **Frontend JavaScript Sanitization:** Hardcoded tokens in `attendanceService.js`, `erp-supabase.js`, `quiz-api.js`, `student-supabase.js`, and `teacher-attendance-roster.js` were eliminated and redirected through the centralized `window.ERP_CONFIG` service.
4. **Strict Git Exclusion Rules:** `.gitignore` was updated to unconditionally ignore `.env`, `.env.*`, `supabase_keys.json`, `secrets/`, and `*.secret`.
5. **Key Invalidation Notice:** In accordance with industry security standards, **the previously exposed Supabase `service_role` key is treated as compromised**. Project administrators must rotate this secret in the Supabase Dashboard prior to public production deployment.

---

## 2. Secrets Classification Matrix

| Secret / Credential | Scope | Location | Allowed in Frontend? | Risk Profile |
| :--- | :--- | :--- | :--- | :--- |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Server-Only | Backend Environment (`.env`) | **STRICTLY FORBIDDEN** | **CRITICAL** (Bypasses Row Level Security; grants root database access) |
| **`DATABASE_URL` (PostgreSQL Password)** | Server-Only | Backend Environment (`.env`) | **STRICTLY FORBIDDEN** | **CRITICAL** (Direct PostgreSQL connection to Supabase pooler) |
| **`SUPABASE_JWT_SECRET`** | Server-Only | Backend Environment (`.env`) | **STRICTLY FORBIDDEN** | **CRITICAL** (Signs and verifies user authentication tokens) |
| **`SUPABASE_ANON_KEY`** | Public Client | Backend `.env` & Frontend `config.js` | **ALLOWED** (Read-Only client with RLS) | **LOW** (Constrained by PostgreSQL Row Level Security policies) |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** | Public Client | Frontend / Optional | **ALLOWED** | **LOW** (Modern client publishable identifier) |

---

## 3. Frontend Security Architecture

### 3.1 Zero-Secret Invariant
The frontend client executes in an untrusted browser environment. Under no circumstances may server secrets, service-role keys, or database passwords ever be shipped to, imported by, or rendered in frontend assets.

### 3.2 Public Client Key Usage
The Supabase **`anon` (anonymous) key** is designed for browser-side SDK initialization. It functions strictly as an API identity gateway. When a browser initiates requests to Supabase REST or Realtime endpoints using the `anon` key:
- PostgreSQL enforces **Row-Level Security (RLS)** policies on all tables.
- Students and teachers can only read and mutate rows permitted by their verified authentication session (`auth.uid()`).
- Unauthenticated requests are restricted to public catalog views (e.g. active departments, published certificates).

### 3.3 Dynamic Public Configuration Sync
To prevent hardcoded client-side tokens from requiring manual edits during key rotations, the backend exposes a safe public metadata endpoint:
```http
GET /api/v1/system/config
```
**Endpoint Response:**
```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "supabase_url": "https://gftqvclenyplnuoocbwe.supabase.co",
    "supabase_anon_key": "<public_anon_key>",
    "project_name": "SSGMCE College ERP Unified System",
    "version": "2.0.0"
  }
}
```
> [!IMPORTANT]
> The `/system/config` endpoint **never** outputs `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or internal system passwords.
> `frontend/js/config.js` automatically synchronizes with this endpoint at application bootstrap.

---

## 4. Backend Secrets & Server Architecture

### 4.1 Strict Environment Variable Loading
All backend services load configuration exclusively from environment variables via `python-dotenv`:
```python
# backend/config/settings.py
from dotenv import load_dotenv

load_dotenv(os.path.join(ERP_ROOT, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL: str = os.getenv("DATABASE_URL", "")
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
```
If `DATABASE_URL` is missing from the environment, the backend logs a configuration warning directing administrators to configure `.env` based on `.env.example`.

### 4.2 Logging Sanitization
Under no condition are credentials printed to system logs, console outputs, or error traces:
- Database connection strings are never logged with plain-text credentials.
- Authorization header tokens are never echoed in HTTP error payloads.
- Stack traces generated during database connection errors mask host connection parameters.

---

## 5. Environment Configuration Template (`.env.example`)

The repository includes a clean, unpopulated environment template at [`.env.example`](file:///d:/ERP-SYSTEM/.env.example):
```bash
# Server Configuration
PORT=8000
PROJECT_NAME="SSGMCE College ERP Unified System"
VERSION="2.0.0"

# PostgreSQL Database Connection (Server-Only)
DATABASE_URL=

# Supabase Project Endpoints
SUPABASE_URL=

# Supabase Public Client Key
SUPABASE_ANON_KEY=

# Supabase Server-Only Secret Keys (NEVER EXPOSE TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Public Frontend Client Keys
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

---

## 6. Git Security & Ignore Configuration

The root [`.gitignore`](file:///d:/ERP-SYSTEM/.gitignore) strictly enforces secrets isolation:
```gitignore
# Secrets & Environment Variables
.env
.env.*
!.env.example
supabase_keys.json
secrets/
*.secret
```

---

## 7. Supabase Key Invalidation & Rotation Procedure

Because the legacy `service_role` key was exposed in plaintext, administrators must rotate the project's keys before production deployment:

### Step 1: Access Supabase Dashboard
1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select the project: `gftqvclenyplnuoocbwe`.
3. Navigate to **Project Settings** → **API**.

### Step 2: Rotate the JWT Secret & Keys
1. Under **JWT Settings**, click **Generate new secret**.
2. Confirm the key regeneration dialog.
   *(Note: This immediately invalidates existing JWT tokens, the compromised `service_role` key, and the legacy `anon` key).*
3. Copy the newly generated:
   - **`anon` (public)** key
   - **`service_role` (secret)** key

### Step 3: Update Backend Environment
1. Update `.env` on the host server:
   ```bash
   SUPABASE_ANON_KEY="<new_anon_key>"
   SUPABASE_SERVICE_ROLE_KEY="<new_service_role_key>"
   ```
2. Restart the unified backend:
   ```powershell
   .\run_backend.bat
   ```
3. Verify that `/api/v1/system/config` serves the updated public anon key to frontend clients.

---

## 8. Deployment Security Best Practices

1. **Host Environment Variables:** In cloud platforms (e.g. AWS ECS, Render, Docker, Azure App Service), supply credentials via platform secret managers or environment variable configurations, never committing `.env` files into container images.
2. **Row-Level Security (RLS) Enforcement:** Always verify that every table in Supabase PostgreSQL has RLS enabled (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).
3. **Database Connection SSL:** Always enforce `sslmode=require` or connect through Supabase transaction/session poolers on port `6543`.
4. **Automated Secret Scanning:** Maintain CI/CD pipelines equipped with secret scanners (e.g., `gitleaks`, `trufflehog`, GitHub Secret Scanning) to prevent accidental commits of keys.
