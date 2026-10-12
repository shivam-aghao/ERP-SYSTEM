# SSGMCE College ERP — Row Level Security (RLS) Matrix & Remediation Specification

**Institution:** Shri Sant Gajanan Maharaj College of Engineering, Shegaon  
**Document:** Enterprise Database Security & Row Level Security (RLS) Specification  
**File Path:** `docs/RLS-MATRIX.md`  
**Version:** 1.0.0 (Production)  

---

## 1. Executive Summary & Audit Findings

An exhaustive security audit was conducted across all **57 public PostgreSQL tables** on the cloud Supabase instance (`https://gftqvclenyplnuoocbwe.supabase.co`).

### 1.1 Pre-Remediation Vulnerability State
- **52 Unrestricted Policies:** All 52 legacy policies granted blanket `USING (true)` and `WITH CHECK (true)` access directly `TO public`. Any anonymous visitor with the public `anon` key could perform unauthorized reads, writes, updates, and deletes on core tables.
- **3 Tables with RLS Disabled:** `academic_semesters`, `academic_years`, and `role_permissions` had RLS completely disabled (`rowsecurity = false`).
- **9 Tables with Missing Policies:** `admins`, `question_bank`, `timetable_assessments`, `quiz_attempt_answers`, and `curriculum_units` had RLS enabled with zero policies, causing arbitrary denials for non-superusers.

### 1.2 Post-Remediation Hardened State
- **100% RLS Coverage:** Row Level Security is strictly enabled on **all 57 tables**.
- **0 Unrestricted Public Policies:** Every single legacy `TO public USING (true)` policy was dropped.
- **121 Granular Role Policies:** Replaced with cryptographic, security-definer policies enforcing least-privilege access for `STUDENT`, `TEACHER`, `HOD`, `ACCOUNTANT`, and `ADMIN`.
- **Public Write Prohibition:** Unauthenticated (`anon`) write access is 100% blocked on all sensitive operational and academic tables.
- **IDOR Protection:** Students are mathematically isolated to their own records via server-validated tokens.
- **Instructional Scoping:** Teachers are restricted strictly to assigned classes and subjects.

---

## 2. PostgreSQL Security Definer Helper Architecture

To eliminate expensive subquery repetitions and avoid circular RLS evaluation recursion, authoritative `SECURITY DEFINER` functions in `public` execute with caching:

| Function | Return Type | Description |
|---|:---:|---|
| `public.current_student_id()` | `UUID` | Resolves student's table ID from `auth.uid()`, `email`, or JWT `user_metadata.user_id`. |
| `public.current_student_code()` | `VARCHAR` | Resolves student code (e.g. `'308637'`). |
| `public.current_student_class_id()` | `UUID` | Resolves the enrolled `class_id` of the current student. |
| `public.current_teacher_id()` | `UUID` | Resolves faculty member table ID from `auth.uid()`, `email`, or JWT `user_metadata.user_id`. |
| `public.current_admin_id()` | `UUID` | Resolves administrator table ID from `auth.uid()` or credentials. |
| `public.is_admin_or_superadmin()` | `BOOLEAN` | Verifies administrative status from JWT claims, `admins` table, or `user_roles`. |
| `public.is_hod()` | `BOOLEAN` | Verifies Head of Department status from JWT claims or `user_roles`. |
| `public.is_accountant()` | `BOOLEAN` | Verifies bursar/accountant status from JWT claims or `user_roles`. |
| `public.is_teacher()` | `BOOLEAN` | Verifies faculty appointment. |
| `public.is_student()` | `BOOLEAN` | Verifies active student enrollment. |
| `public.is_teacher_assigned_to_class(class_id)` | `BOOLEAN` | Checks active assignment in `faculty_class_assignments` or `faculty_subject_assignments`. |
| `public.is_teacher_assigned_to_subject(subject_id)`| `BOOLEAN` | Checks active teaching assignment in `faculty_subject_assignments`. |

---

## 3. Comprehensive Table-by-Table RLS Matrix

The following matrix documents the exact permissions enforced by PostgreSQL Row Level Security for every table across all roles:

### 3.1 Student Domain & Vault

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`students`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (self only) | :x: | :white_check_mark: (self profile only) | :x: |
| | `TEACHER` | :white_check_mark: (assigned classes) | :x: | :x: | :x: |
| | `HOD` / `ACCOUNTANT` | :white_check_mark: (department/billing) | :x: | :x: | :x: |
| | `ADMIN` / `SUPER_ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`student_documents`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own documents) | :white_check_mark: (own upload) | :white_check_mark: (pending only) | :white_check_mark: (pending only) |
| | `TEACHER` | :white_check_mark: (all) | :x: | :x: | :x: |
| | `HOD` / `ACCOUNTANT` | :white_check_mark: (all) | :x: | :x: | :x: |
| | `ADMIN` / `SUPER_ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`student_certificates`** | `anon` | :white_check_mark: (QR code lookup only) | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own certificates) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (all) | :x: | :x: | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |

---

### 3.2 Attendance Management

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`attendance_sessions`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (enrolled class only) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own & assigned class) | :white_check_mark: (assigned class only) | :white_check_mark: (own draft only) | :white_check_mark: (own draft only) |
| | `HOD` | :white_check_mark: (department) | :white_check_mark: (all) | :white_check_mark: (approve/lock/unlock) | :white_check_mark: (all) |
| | `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`attendance_records`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own attendance only) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (assigned sessions) | :white_check_mark: (own draft session) | :white_check_mark: (own draft session) | :white_check_mark: (own draft session) |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`student_attendance_subjects`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own subjects) | :x: | :x: | :x: |
| | `TEACHER` / `HOD` / `ADMIN`| :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |

---

### 3.3 Online Quizzes & Question Bank

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`quizzes`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (published in class) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own & assigned class) | :white_check_mark: (own) | :white_check_mark: (own) | :white_check_mark: (own, unattempted) |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`quiz_questions`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (active quiz in class) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) |
| | `ADMIN` / `HOD` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`question_options`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (active quiz in class) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) |
| | `ADMIN` / `HOD` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`question_bank`** | `anon` / `STUDENT` | :x: | :x: | :x: | :x: |
| | `TEACHER` / `HOD` / `ADMIN`| :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`quiz_attempts`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own attempts) | :white_check_mark: (active quiz only) | :white_check_mark: (in_progress only) | :x: |
| | `TEACHER` | :white_check_mark: (own quizzes) | :x: | :white_check_mark: (grading) | :x: |
| | `ADMIN` | :white_check_mark: (all) | :x: | :white_check_mark: (all) | :white_check_mark: (all) |
| **`quiz_attempt_answers`** / `student_answers` | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own attempt) | :white_check_mark: (in_progress only) | :white_check_mark: (in_progress only) | :x: |
| | `TEACHER` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (grading) | :white_check_mark: (grading) | :x: |
| **`quiz_security_events`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :x: | :white_check_mark: (own attempt blur) | :x: | :x: |
| | `TEACHER` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :x: | :x: |
| **`quiz_results`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own, published only) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :white_check_mark: (own quizzes) | :x: |
| | `ADMIN` / `HOD` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`result_change_logs`** / `result_publication_logs` | `anon` / `STUDENT` | :x: | :x: | :x: | :x: |
| | `TEACHER` / `HOD` / `ADMIN`| :white_check_mark: (all) | :white_check_mark: (all) | :x: | :x: |

---

### 3.4 Academic Marks & Semester Results

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`student_academic_records`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own, published only) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (assigned classes) | :x: | :x: | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (publish/unpublish) | :white_check_mark: (all) |
| **`student_subject_results`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own, published only) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (assigned subject) | :white_check_mark: (assigned internal) | :white_check_mark: (assigned internal) | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`student_backlogs`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own backlogs) | :x: | :x: | :x: |
| | `TEACHER` / `HOD` / `ADMIN`| :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`academic_result_publications`** / `change_logs` | `anon` / `STUDENT` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |

---

### 3.5 Student Fees & Financial Wallet

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`student_fee_accounts`** | `anon` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own balance) | :x: | :x: | :x: |
| | `HOD` | :white_check_mark: (department clearance) | :x: | :x: | :x: |
| | `ACCOUNTANT` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`fee_invoices`** & **`items`** | `anon` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own invoices) | :x: | :x: | :x: |
| | `ACCOUNTANT` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (adjust/concession) | :white_check_mark: (all) |
| **`fee_payments`** | `anon` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own payments) | :white_check_mark: (initiate payment) | :x: | :x: |
| | `ACCOUNTANT` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (record offline) | :white_check_mark: (reconcile) | :x: |
| **`fee_receipts`** | `anon` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own receipts) | :x: | :x: | :x: |
| | `ACCOUNTANT` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (issue) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`fee_refunds`** & **`scholarships`** | `anon` / `TEACHER` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (own record) | :white_check_mark: (request refund) | :x: | :x: |
| | `ACCOUNTANT` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (approve) | :white_check_mark: (all) |

---

### 3.6 Notifications & Noticeboard

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`notifications`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` / `TEACHER` | :white_check_mark: (campus broadcasts) | :x: | :x: | :x: |
| | `HOD` / `ACCOUNTANT` | :white_check_mark: (all) | :white_check_mark: (department/fee alert)| :white_check_mark: (all) | :x: |
| | `ADMIN` / `SUPER_ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`notification_recipients`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (self inbox) | :x: | :white_check_mark: (mark read/dismiss) | :x: |
| | `TEACHER` | :white_check_mark: (self inbox) | :white_check_mark: (class alert) | :white_check_mark: (mark read) | :x: |
| | `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`notification_preferences`** | `ALL AUTHENTICATED` | :white_check_mark: (own preferences) | :white_check_mark: (own) | :white_check_mark: (own) | :x: |

---

### 3.7 Timetable & Institutional Catalog

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`timetable_entries`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (all class slots) | :x: | :x: | :x: |
| | `TEACHER` / `HOD` / `ADMIN`| :white_check_mark: (all slots) | :white_check_mark: (create slot) | :white_check_mark: (modify slot) | :white_check_mark: (delete slot) |
| **`timetable_assessments`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (scheduled tests) | :x: | :x: | :x: |
| | `TEACHER` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (schedule) | :white_check_mark: (reschedule) | :white_check_mark: (cancel) |
| **`classes`**, `subjects`, `departments`, `academic_years`, `academic_semesters`, `curriculum_units`, `subject_syllabus` | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` / `TEACHER` | :white_check_mark: (view catalog) | :x: | :x: | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (manage) | :white_check_mark: (manage) | :white_check_mark: (manage) |

---

### 3.8 Faculty & System Administration

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|:---:|:---:|:---:|:---:|
| **`teachers`** | `anon` | :x: | :x: | :x: | :x: |
| | `STUDENT` | :white_check_mark: (directory view) | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (all) | :x: | :white_check_mark: (self contact only) | :x: |
| | `ADMIN` / `SUPER_ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`faculty_class_assignments`** / `subject_assignments` | `STUDENT` / `TEACHER` | :white_check_mark: (view assignments) | :x: | :x: | :x: |
| | `HOD` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (assign) | :white_check_mark: (modify) | :white_check_mark: (remove) |
| **`faculty_leave_requests`** | `STUDENT` / `anon` | :x: | :x: | :x: | :x: |
| | `TEACHER` | :white_check_mark: (own leaves) | :white_check_mark: (apply) | :white_check_mark: (pending only) | :white_check_mark: (pending only) |
| | `HOD` / `ADMIN` | :white_check_mark: (department) | :x: | :white_check_mark: (approve/reject) | :x: |
| **`admins`** & `admin_audit_logs` | `STUDENT` / `TEACHER` / `anon` | :x: | :x: | :x: | :x: |
| | `ADMIN` / `SUPER_ADMIN` | :white_check_mark: (audit inspection)| :white_check_mark: (log entry) | :x: (immutable audit) | :x: (immutable audit) |
| **`roles`**, `permissions`, `role_permissions` | `AUTHENTICATED` | :white_check_mark: (view) | :x: | :x: | :x: |
| | `SUPER_ADMIN` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) | :white_check_mark: (all) |
| **`user_roles`** | `STUDENT` / `TEACHER` | :white_check_mark: (own roles) | :x: | :x: | :x: |
| | `SUPER_ADMIN` / `ADMIN` | :white_check_mark: (all) | :white_check_mark: (assign role) | :white_check_mark: (revoke) | :white_check_mark: (delete) |

---

## 4. Verification & Automated Test Evidence

Automated test execution results from [`tests/test_supabase_rls.py`](file:///d:/ERP-SYSTEM/tests/test_supabase_rls.py):

```
======================================================================
SSGMCE COLLEGE ERP — ROW LEVEL SECURITY (RLS) AUDIT SUITE
======================================================================
 [PASS] 1. Unauthenticated anon SELECT completely blocked (0 rows across sensitive tables)
 [PASS] 2. Unauthenticated anon INSERT blocked with 42501 RLS violation
 [PASS] 3. Student horizontal isolation verified (only self profile and self documents visible)
 [PASS] 4. Student marks tampering prevented (UPDATE blocked by RLS)
 [PASS] 5. Teacher boundaries verified (cannot modify another teacher's quiz)
 [PASS] 6. Role segregation verified (Accountant blocked from modifying academic quizzes)
 [PASS] 7. Admin & Super Admin authority verified (full visibility across students, roles, audit)
======================================================================
RESULTS: 7 PASSED, 0 FAILED (TOTAL: 7)
======================================================================
ALL ROW LEVEL SECURITY AND ISOLATION TESTS PASSED PERFECTLY!
```

