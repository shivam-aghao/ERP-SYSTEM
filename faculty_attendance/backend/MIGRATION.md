# Migration Guide: Mock/LocalStorage to Production PostgreSQL Backend

This document details the transition strategy from the simulated mock JavaScript layer (`ERP_DATA` in `data.js` and localStorage persistence) to the production PostgreSQL + Prisma + Express.js backend.

---

## 1. Migration Architecture & Strategy

To avoid breaking existing frontend views, UI state, or user interactions, a **Parallel Adapter Pattern** was implemented:

```
[ Frontend: index.html + app.js ]
              │
              ▼
    [ js/attendanceService.js ]  <── Maintains exact existing signatures
              │
      ┌───────┴────────┐
      ▼                ▼
[ js/api.js ]    [ LocalStorage Cache ]
(Real Backend)   (Zero-latency UI & Offline Fallback)
      │
      ▼
[ Express API ] (Port 5000)
      │
[ Prisma ORM ]
      │
[ PostgreSQL DB ] (Port 5432)
```

### Benefits:
1. **Zero UI/DOM Changes**: The DOM structure, classes, IDs, styles, and animation loops remain 100% untouched.
2. **Instant Visual Feedback**: Synchronous reads (such as rendering recent records or checking local drafts) resolve immediately while background sync verifies with the backend.
3. **Resilience**: If the backend is restarting, applying migrations, or temporarily offline, the frontend falls back gracefully to local storage without throwing uncaught exceptions.

---

## 2. Data Schema Mapping

| Frontend (Mock / LocalStorage) | Backend PostgreSQL Model (Prisma) | Notes |
| :--- | :--- | :--- |
| `ERP_DATA.teacher` | `User` table | Linked to `Department` via `departmentId`. Passwords hashed with bcrypt (salt cost 12). |
| `ERP_DATA.departments` | `Department` table | Stores codes (`CSE`, `IT`, `EE`, `MECH`, `ENTC`, `ASH`). |
| `ERP_DATA.classes` | `Class` table | Linked to `Department`. Contains `year`, `division`, `strength`. |
| `ERP_DATA.subjects` | `Subject` table | Stores code, name, credits, semester, subject type. |
| `ERP_DATA.students` (60 students) | `Student` table | Linked to `Class`. Roll 1-60 with full names and student codes (`23CSE001` - `23CSE060`). |
| `erp_teacher_class_cards` | `ClassCard` table | Unique constraint on `[teacherId, departmentId, classId, subjectId]`. |
| `erp_attendance_records` | `AttendanceSession` + `AttendanceRecord` | Normalized relational tables. Atomic transactions update student attendance and rolling history. |
| Student history (P/A dots) | `AttendanceHistorySummary` | Stores last 10 statuses (e.g. `PPPPPPAPPA`) per student-subject pair. |
| Teacher notification count (`3`) | `Notification` table | Seeded with 3 active institutional notifications. |

---

## 3. Step-by-Step Transition Checklist

### Step 1: Initialize Database
Run database migrations and seed script:
```bash
cd faculty_attendence/backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### Step 2: Start API Server
```bash
npm run dev
# or
docker-compose up -d
```
Verify the server is running by accessing `http://localhost:5000/health`.

### Step 3: Frontend Deployment
1. Ensure `<meta name="api-base" content="http://localhost:5000/api/v1">` is present in `faculty_attendence/index.html`.
2. Ensure `<script src="js/api.js"></script>` is loaded prior to `js/attendanceService.js`.
3. Open `faculty_attendence/index.html` in your browser or local web server (`http://localhost:5500` or `http://localhost:3000`).

---

## 4. Rollback Plan

If you ever need to run purely offline without a running backend:
- The adapter in `attendanceService.js` automatically detects when the backend is unreachable and falls back to browser localStorage without UI interruption.
- To completely revert to the original local-only mock file, restore the backup of `attendanceService.js` and remove the `api.js` script tag from `index.html`.
