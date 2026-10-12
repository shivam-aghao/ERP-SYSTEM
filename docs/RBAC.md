# SSGMCE College ERP — Role-Based Access Control (RBAC) Specification

**Institution:** Shri Sant Gajanan Maharaj College of Engineering, Shegaon  
**Document:** Enterprise Role-Based Access Control Architecture  
**File Path:** `docs/RBAC.md`  
**Version:** 1.0.0 (Production)  

---

## 1. Architectural Principles

1. **Backend as the Sole Authority:**
   All permissions and role boundaries are authoritatively enforced on the backend server (`backend/rbac/`, `backend/auth/`). Frontend permission checks (such as `AuthClient.hasPermission`) exist exclusively for UI element visibility and presentation; they are never trusted for security decisions.

2. **Zero-Trust Client Identity:**
   User identity and role are derived strictly from cryptographically signed, server-validated JSON Web Tokens (JWT) or active backend sessions. Client-supplied headers, URL query parameters, or `localStorage` values cannot alter or elevate privileges.

3. **Prevention of Vertical Privilege Escalation:**
   Users with lower privileges (`student`, `teacher`, `accountant`) are strictly blocked with `403 Forbidden` from executing actions reserved for higher-tier roles (`admin`, `super_admin`, `hod`), regardless of route manipulation.

4. **Prevention of Horizontal Privilege Escalation (IDOR Prevention):**
   - **Student Isolation:** A student can only access and query their own private profile, fee wallet, examination results, and notifications (`verify_student_self`).
   - **Teacher Scoping:** A teacher can only record attendance, enter marks, or create quizzes for the specific classes and subjects to which they are assigned in institutional master records (`verify_teacher_assignment`).

5. **Explicit Administrative Permissions:**
   Administrative operations require explicit permissions rather than loose blanket checks. Permissions are managed centrally without duplicate role tables.

---

## 2. Roles Hierarchy & Descriptions

| Role | Hierarchy Level | Primary Responsibilities |
|---|:---:|---|
| **`SUPER_ADMIN`** | **100** | Root system administrator. Possesses full bypass and institutional infrastructure control. |
| **`ADMIN`** | **80** | Full ERP operational manager. Manages faculty, classes, subjects, leaves, fee audits, and institutional reports. |
| **`ACCOUNTANT`** | **60** | College Bursar / Cashier. Manages student fee ledgers, payment transactions, concessions, fee invoices, and financial exports. |
| **`HOD`** | **50** | Head of Department. Approves and unlocks class attendance sessions, reviews faculty leave requests, publishes department results, and views department analytics. |
| **`TEACHER`** | **20** | Academic faculty. Marks attendance, manages drafts, conducts online quizzes, enters internal marks, and applies for leave. Scoped strictly to assigned classes. |
| **`STUDENT`** | **10** | Enrolled learner. Views personal timetable, personal attendance, published semester results, examination evaluations, pays fees, and uploads vault documents. |

---

## 3. Canonical Role × Permission Matrix

The following matrix documents the authoritative permission mapping enforced across the SSGMCE College ERP:

| Permission Identifier | Module | Description | `SUPER_ADMIN` | `ADMIN` | `HOD` | `TEACHER` | `ACCOUNTANT` | `STUDENT` |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `student.view` | Student | View student profile & academic details | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :white_check_mark: (billing) | :white_check_mark: (self only) |
| `student.edit` | Student | Edit student contact & biographical info | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: (self only) |
| `attendance.view` | Attendance | View attendance records and statistics | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :white_check_mark: (self only) |
| `attendance.create` | Attendance | Take attendance & create session drafts | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :x: |
| `attendance.edit` | Attendance | Modify attendance drafts before locking | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :x: |
| `attendance.export` | Attendance | Export attendance reports to Excel/CSV | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :x: |
| `attendance.approve` | Attendance | Lock and formally approve attendance | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `attendance.unlock` | Attendance | Reopen locked attendance session | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `quiz.view` | Quiz | View quiz listings & question bank | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (active quizzes) |
| `quiz.create` | Quiz | Author new quizzes & question items | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `quiz.edit` | Quiz | Edit quiz settings & questions | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `quiz.publish` | Quiz | Publish quiz to class & timetable | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `quiz.delete` | Quiz | Delete quiz and associated attempts | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | :x: |
| `quiz.view_results` | Quiz | View quiz attempt scores & analytics | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (self only) |
| `quiz.export` | Quiz | Export quiz submissions & analysis | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `marks.view` | Marks | View semester & evaluation marks | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (published only) |
| `marks.create` | Marks | Enter CIE / internal examination marks | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :x: |
| `marks.edit` | Marks | Edit internal marks & assessments | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (assigned) | :x: | :x: |
| `marks.publish` | Marks | Publish semester results to portal | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `fees.view` | Fees | View fee balances, invoices & receipts | :white_check_mark: | :white_check_mark: | :white_check_mark: (clearance) | :x: | :white_check_mark: | :white_check_mark: (self only) |
| `fees.create` | Fees | Make fee payments or record receipts | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | :white_check_mark: (self only) |
| `fees.update` | Fees | Adjust fee invoices, fines & concessions | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | :x: |
| `fees.export` | Fees | Export fee reconciliation & audits | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | :x: |
| `documents.view` | Documents | Access documents in digital vault | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (fee challans) | :white_check_mark: (self only) |
| `documents.upload` | Documents | Upload verified institutional docs | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (self only) |
| `documents.delete` | Documents | Revoke or purge document records | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | :x: |
| `timetable.view` | Timetable | View scheduled classes & slots | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (enrolled class) |
| `timetable.create` | Timetable | Schedule tests & assessments | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `timetable.edit` | Timetable | Modify or delete scheduled slots | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `notifications.view` | Notifications | View alerts & noticeboard entries | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: (self only) |
| `notifications.manage` | Notifications | Broadcast alerts & targeted pings | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (fee notices) | :x: |
| `leave.apply` | Faculty | Submit faculty leave requests | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `leave.approve` | Faculty | Approve or reject faculty leave | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `reports.view` | Reports | View institutional analytics | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (financial) | :x: |
| `reports.export` | Reports | Export institutional reports | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: (financial) | :x: |
| `rbac.manage` | Security | Assign roles & manage permissions | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | :x: |
| `system.manage` | System | View audit logs & server settings | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | :x: |

---

## 4. Enforcement Mechanisms

### 4.1 Dependency Injection in FastAPI

Backend routes enforce authorization declaratively using FastAPI dependencies:

```python
from fastapi import APIRouter, Depends
from backend.rbac.dependencies import require_permission, require_role
from backend.rbac.models import Permission, RoleName
from backend.auth.models import AuthenticatedUser

router = APIRouter(prefix="/api/v1")

# Explicit permission requirement
@router.post("/academic/results/publish")
def publish_results(
    current_user: AuthenticatedUser = Depends(require_permission(Permission.MARKS_PUBLISH.value))
):
    ...

# Explicit role requirement
@router.get("/management/admin/dashboard")
def get_admin_dashboard(
    current_user: AuthenticatedUser = Depends(require_role([RoleName.ADMIN.value, RoleName.SUPER_ADMIN.value]))
):
    ...
```

### 4.2 Horizontal Privilege Escalation Prevention

#### Student Self-Service Isolation
```python
from backend.rbac.service import RBACService

@router.get("/student/fees")
def get_fee_wallet(student_code: str, current_user: AuthenticatedUser = Depends(...)):
    # Automatically validates that a student cannot query another student's wallet
    validated_code = RBACService.verify_student_self(current_user, requested_student_code=student_code)
    return FeeService.get_wallet(validated_code)
```

#### Teacher Instructional Scoping
```python
@router.post("/attendance/submit")
def submit_attendance(payload: AttendanceSubmitRequest, current_user: AuthenticatedUser = Depends(...)):
    # Verifies that teacher is assigned to instruct class_id and subject_id
    RBACService.verify_teacher_assignment(
        current_user=current_user,
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        db=db
    )
    return AttendanceService.submit(payload)
```

---

## 5. Frontend UI Visibility SDK

Frontend client code in `frontend/common/auth/auth-client.js` provides utility helpers to conditionally render navigation items and action buttons:

```javascript
// Check specific permission
if (AuthClient.hasPermission('quiz.create')) {
  document.getElementById('btn-create-quiz').style.display = 'block';
}

// Declarative HTML attributes:
// <button data-permission="attendance.approve">Approve Attendance</button>
// <div data-role="admin,hod">Department Analytics</div>
AuthClient.applyUIPermissions();
```

> **Security Note:** Hiding elements on the client side provides UX convenience only. If a user bypasses the UI and dispatches an HTTP request, the backend intercepts and halts unauthorized operations with `403 Forbidden`.

---

## 6. Audit Trail & Incident Logging

Every privileged action (approvals, mark submissions, role changes, fee adjustments) creates an immutable audit record in `audit_logs` tracking:
- Actor User ID & Role
- Action Name (`attendance.approve`, `leave.review`, `fees.update`, `rbac.assign`)
- Entity Name & Entity ID
- Timestamp (UTC)
- State Diffs & Payloads

