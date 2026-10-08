# ERP Business Data Storage Architecture & Zero-LocalStorage Enforcement

**SSGMCE Autonomous College ERP System**  
**Database Authority**: Supabase PostgreSQL (`gftqvclenyplnuoocbwe.supabase.co`)  
**Backend REST API**: FastAPI (`/api/v1`)  
**Specification**: Elimination of Browser Storage as Authoritative Business Truth

---

## 1. Executive Summary

In legacy iterations of the ERP application, several modules utilized `localStorage` and `sessionStorage` as local fallback databases or shadow stores. This resulted in severe data integrity defects:
1. **Data Divergence / Ghost Data**: Edits or submissions performed on one browser tab/window or machine never reflected on another device or for other users.
2. **False Operational Success**: Network, authentication, or database failures were silently swallowed by fallback routines that generated artificial local records, leaving users believing their changes were committed to the institutional system.
3. **Privilege & Identity Inconsistencies**: Modules fell back to hardcoded student/teacher identifiers (`"Shivam Aghao"`, `"FAC-01"`, `"308637"`), bypassing the authenticated user's actual database record.

Under this remediation, **Supabase PostgreSQL is the sole, authoritative source of truth for all ERP business entities**. Browser storage has been strictly audited and purged of all business entities, drafts, rosters, and fallback data.

---

## 2. Storage Boundary Matrix

| Storage Category | Permitted Mechanisms | Authorized Use Cases | Prohibited Content |
|---|---|---|---|
| **ERP Business Data** | **Supabase PostgreSQL via Backend API / RLS** | Attendance sessions, attendance records, marks, syllabus, timetable assessments, student profiles, teacher rosters, quizzes, questions, notifications, fee records | ❌ NEVER store in `localStorage`, `sessionStorage`, or indexedDB as authoritative truth |
| **Authentication Session** | `sessionStorage` (or `localStorage` only when "Remember Me" is checked) | Ephemeral JWT access token (`ssgmce_access_token`), refresh token (`ssgmce_refresh_token`), verified user identity cache (`ssgmce_user_cache`) | ❌ Unverified roles, spoofed student/teacher IDs, fake credentials |
| **UI State & Display Preferences** | `localStorage` | Dark/light theme, collapsed/expanded sidebar state, temporary faculty selector filter for viewing load | ❌ Business records, offline mock data, fallback rosters |

---

## 3. Purged Keys & Remediation Details

### A. Attendance Management
- **Legacy Storage Keys Purged**:
  - `erp_attendance_records` (Previously held locally marked attendance sessions)
  - `erp_attendance_drafts` (Held offline draft attendance data)
  - `erp_teacher_class_cards` (Held cached teacher class assignments)
- **Remediated Files**:
  - [`frontend/js/teacher-attendance-service.js`](file:///d:/ERP-SYSTEM/frontend/js/teacher-attendance-service.js): All methods (`getAllRecords`, `getDraft`, `saveDraft`, `submitAttendance`, `getAllClassCards`) dispatch live REST calls to `/api/v1/attendance/...`. Network errors trigger visible notifications rather than silent local caching.
  - [`frontend/js/erp-supabase.js`](file:///d:/ERP-SYSTEM/frontend/js/erp-supabase.js): Removed local storage fallback inside `submitAttendanceSession()`. Failures return standard `{ success: false, error }` results.

### B. Timetable & Scheduled Assessments
- **Legacy Storage Keys Purged**:
  - `ssgmce_scheduled_tests` (Shared test schedules across tabs via storage events)
- **Remediated Files**:
  - [`frontend/js/teacher_timetable.js`](file:///d:/ERP-SYSTEM/frontend/js/teacher_timetable.js): Test scheduling saves directly to database table `timetable_assessments` via `POST /api/v1/timetable/tests` or Supabase client.
  - [`frontend/js/student_timetable.js`](file:///d:/ERP-SYSTEM/frontend/js/student_timetable.js): Removed `loadCachedTests()` reading `ssgmce_scheduled_tests`. Tests are fetched authoritatively from `/api/v1/timetable/tests`.
  - [`student/timetable/student_timetable.js`](file:///d:/ERP-SYSTEM/student/timetable/student_timetable.js): Cleared `ssgmce_scheduled_tests` read/write and storage event listener.
  - [`student/frontend/timetable/student_timetable.js`](file:///d:/ERP-SYSTEM/student/frontend/timetable/student_timetable.js): Cleared `ssgmce_scheduled_tests` read/write and storage event listener.
  - [`frontend/js/student-dashboard.js`](file:///d:/ERP-SYSTEM/frontend/js/student-dashboard.js): Purged fallback to `ssgmce_scheduled_tests` for the upcoming assessment alert strip.

### C. Student Profile Mutations
- **Legacy Storage Keys Purged**:
  - `ssgmce_student_profile_data` (Stored edited mobile, email, blood group, emergency contact in browser)
- **Remediated Files**:
  - [`frontend/js/student-profile.js`](file:///d:/ERP-SYSTEM/frontend/js/student-profile.js): `saveProfileChanges()` performs an authenticated `PUT /api/v1/student/profile` or calls `StudentApi.updateProfile()`. Real server validation occurs; on failure, a visible toast error is presented.
  - [`frontend/js/profile.js`](file:///d:/ERP-SYSTEM/frontend/js/profile.js): Synchronized with `student-profile.js` to persist mutations to PostgreSQL.
  - [`frontend/js/student-supabase.js`](file:///d:/ERP-SYSTEM/frontend/js/student-supabase.js): Removed localStorage overlay in `getStudentProfile()` and local shadow store in `updateProfile()`.

### D. Hardcoded Identities & Fake Authentication Fallbacks
- **Remediated Files**:
  - [`frontend/js/api.js`](file:///d:/ERP-SYSTEM/frontend/js/api.js): Removed catch handler that auto-returned mock faculty member `FAC-01` (`1f33bd6c-cab3-4205-8daa-1ac23b4d3552`) with default credentials.
  - [`frontend/js/student_timetable.js`](file:///d:/ERP-SYSTEM/frontend/js/student_timetable.js): Removed hardcoded fallback student context `"Shivam Aghao"` (CSE 2R1, roll 21, code 307001). Identity is now derived strictly from `AuthClient.getCurrentUser()` and server session.
  - [`frontend/html/student-quiz.html`](file:///d:/ERP-SYSTEM/frontend/html/student-quiz.html): Removed reads from `sessionStorage.getItem('loginData')` and `localStorage.getItem('ssgmce_student_profile_data')`. Resolves authenticated student via `AuthClient.getCurrentUser()`.
  - [`frontend/js/attendanceService.js`](file:///d:/ERP-SYSTEM/frontend/js/attendanceService.js): Removed hardcoded fallback student code `'308637'`.

---

## 4. Error Handling & Zero-Silent-Fallback Standard

When an API or database request encounters a network error, timeout, HTTP 4xx, or HTTP 5xx:
1. **Show a Proper Error State**: The UI renders an explicit alert banner, error toast, or empty-state placeholder indicating that server data could not be retrieved.
2. **Never Generate Mock Records**: Applications MUST NOT fabricate records or populate data containers with synthetic placeholders pretending to be live data.
3. **Never Fall Back to Stale Mutation Overrides**: A student's profile or a teacher's attendance session must never reflect an edit that failed to commit to Supabase PostgreSQL.

---

## 5. Verification Scenarios

| Test Scenario | Verification Procedure | Expected Behavior |
|---|---|---|
| **1. Page Refresh** | Navigate to timetable or profile, modify a field (e.g. email), refresh browser. | Changes persist because they were written to Supabase PostgreSQL, not temporary localStorage. |
| **2. Multi-Browser / Cross-Device** | Teacher creates an attendance record in Browser A (Chrome), opens teacher portal in Browser B (Edge/Firefox). | Both browsers display the exact same attendance record from the database. |
| **3. Different Users / Role Switching** | Log in as Student A, view timetable, log out, log in as Student B. | Student B views only their personal timetable; no leaked data from Student A remains in storage. |
| **4. Database Update** | Update student records directly in Supabase SQL editor or backend API. | Frontend immediately reflects new database values upon navigation or refresh. |
| **5. Concurrent Access** | Two faculty members scheduling assessments simultaneously. | Both assessments are stored in `timetable_assessments` and visible to all assigned students. |

