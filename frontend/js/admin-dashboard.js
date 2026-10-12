/**
 * ============================================================================
 * SSGMCE COLLEGE ERP — STEP 8: ADMIN DASHBOARD CONTROLLER
 * Real-time Admin Portal Controller interacting with /api/v1/management APIs
 * ============================================================================
 */

const AdminController = {
  activeTab: 'tab-overview',
  facultyCache: [],
  studentsCache: [],

  async init() {
    this.setupTabs();
    await this.loadDashboardOverview();
    if (window.lucide) window.lucide.createIcons();
  },

  setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetTab = item.getAttribute('data-tab');
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(el => {
      el.classList.toggle('active', el.id === tabId);
    });

    // Update Topbar Title
    const titles = {
      'tab-overview': 'System Overview & Control Hub',
      'tab-faculty': 'Faculty & Teaching Workload Management',
      'tab-students': 'Student Directory & Academic Performance',
      'tab-classes': 'Classes & Curriculum Structure',
      'tab-leaves': 'Faculty Leave Governance & Approvals',
      'tab-attendance': 'Attendance Lock & Exception Handling',
      'tab-reports': 'Institutional Reports & Analytics',
      'tab-results': 'Results & Academic Records Governance',
      'tab-fees': 'Fee Accounts, Collection & Defaulters Governance',
      'tab-documents': 'Student Digital Document Verification Desk',
      'tab-rbac': 'Role-Based Access Control (RBAC)',
      'tab-audit': 'System-wide Immutable Audit Trail'
    };
    const titleEl = document.getElementById('topbarTitle');
    if (titleEl && titles[tabId]) titleEl.textContent = titles[tabId];

    // Trigger tab-specific loader
    if (tabId === 'tab-overview') this.loadDashboardOverview();
    else if (tabId === 'tab-faculty') this.loadFaculty();
    else if (tabId === 'tab-students') this.loadStudents();
    else if (tabId === 'tab-classes') this.loadClasses();
    else if (tabId === 'tab-leaves') this.loadLeaveRequests();
    else if (tabId === 'tab-attendance') this.loadAttendanceGovernance();
    else if (tabId === 'tab-reports') this.loadReports();
    else if (tabId === 'tab-results') this.loadResultsGovernance();
    else if (tabId === 'tab-fees') this.loadFeesGovernance();
    else if (tabId === 'tab-documents') this.loadDocumentDesk();
    else if (tabId === 'tab-rbac') this.loadRBAC();
    else if (tabId === 'tab-audit') this.loadAuditLogs();

    if (window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
  },

  refreshActiveView() {
    this.switchTab(this.activeTab);
  },

  // --------------------------------------------------------------------------
  // 1. DASHBOARD OVERVIEW
  // --------------------------------------------------------------------------
  async loadDashboardOverview() {
    try {
      const res = await fetch('/api/v1/management/admin/dashboard');
      const data = await res.json();
      if (!data.success || !data.data) return;

      const d = data.data;
      const stats = d.stats || {};

      document.getElementById('kpiStudents').textContent = stats.total_students || 304;
      document.getElementById('kpiFaculty').textContent = stats.total_faculty || 15;
      document.getElementById('kpiClasses').textContent = stats.total_classes || 4;
      document.getElementById('kpiLeaves').textContent = stats.pending_leave_requests || 0;
      document.getElementById('kpiSubjects').textContent = stats.total_subjects || 15;
      document.getElementById('kpiAttendance').textContent = (stats.average_attendance_rate || 85.0) + '%';
      
      if (stats.active_academic_year) {
        document.getElementById('activeAcademicYearBadge').textContent = 'AY ' + stats.active_academic_year;
      }

      // Badge for sidebar
      const leaveBadge = document.getElementById('badgePendingLeaves');
      if (leaveBadge) {
        if (stats.pending_leave_requests > 0) {
          leaveBadge.textContent = stats.pending_leave_requests;
          leaveBadge.style.display = 'inline-block';
        } else {
          leaveBadge.style.display = 'none';
        }
      }

      // Render Pending Leaves Table Preview
      const leavesTbody = document.getElementById('overviewLeavesTbody');
      if (leavesTbody) {
        const leaves = d.pending_leaves || [];
        if (leaves.length === 0) {
          leavesTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">No pending leave applications.</td></tr>';
        } else {
          leavesTbody.innerHTML = leaves.map(l => `
            <tr>
              <td><strong>${l.faculty_name}</strong><br><small style="color:var(--admin-muted);">${l.emp_code}</small></td>
              <td><span class="badge badge-info">${l.leave_type}</span></td>
              <td>${l.start_date} to ${l.end_date}</td>
              <td>${l.total_days}d</td>
              <td><span class="badge badge-warning">Pending</span></td>
              <td>
                <button class="btn btn-primary btn-sm" onclick="AdminController.openReviewLeaveModal('${l.leave_id}', '${l.faculty_name}', '${l.leave_type}', '${l.total_days}', 'approved')">Approve</button>
              </td>
            </tr>
          `).join('');
        }
      }

      // Render Recent Audit Logs Preview
      const auditsContainer = document.getElementById('overviewAuditsList');
      if (auditsContainer) {
        const audits = d.recent_audits || [];
        if (audits.length === 0) {
          auditsContainer.innerHTML = '<div style="color:var(--admin-muted); text-align:center;">No recent audit activity.</div>';
        } else {
          auditsContainer.innerHTML = audits.map(a => `
            <div style="border-left: 3px solid var(--admin-blue); padding-left: 10px; margin-bottom: 8px;">
              <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--admin-navy);">
                <span>${a.action}</span>
                <span style="font-size:10px; color:var(--admin-muted);">${new Date(a.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div style="color:var(--admin-muted); font-size:11px;">Module: ${a.module} • Role: ${a.actor_role}</div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Error loading admin dashboard overview:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 2. FACULTY WORKLOAD
  // --------------------------------------------------------------------------
  async loadFaculty() {
    try {
      const res = await fetch('/api/v1/management/reports/faculty');
      const data = await res.json();
      if (!data.success || !data.data) return;

      this.facultyCache = data.data;
      this.renderFacultyTable(this.facultyCache);
    } catch (err) {
      console.error('Error loading faculty report:', err);
    }
  },

  renderFacultyTable(list) {
    const tbody = document.getElementById('facultyTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No faculty found.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(f => `
      <tr>
        <td><strong>${f.emp_code}</strong></td>
        <td><strong>${f.full_name}</strong></td>
        <td>${f.designation || 'Faculty'}</td>
        <td><span class="badge badge-secondary">${f.department || 'CSE'}</span></td>
        <td>${f.assigned_subjects_count || 0} subjects</td>
        <td>${f.assigned_classes_count || 0} classes</td>
        <td>${f.weekly_lecture_hours || 0} hrs</td>
        <td>${f.weekly_practical_hours || 0} hrs</td>
        <td><strong>${f.total_weekly_hours || 0} hrs/wk</strong></td>
        <td><span class="badge badge-success">Active</span></td>
      </tr>
    `).join('');
  },

  filterFaculty(query) {
    const q = query.toLowerCase();
    const filtered = this.facultyCache.filter(f => 
      (f.full_name && f.full_name.toLowerCase().includes(q)) ||
      (f.emp_code && f.emp_code.toLowerCase().includes(q)) ||
      (f.designation && f.designation.toLowerCase().includes(q))
    );
    this.renderFacultyTable(filtered);
  },

  // --------------------------------------------------------------------------
  // 3. STUDENTS DIRECTORY
  // --------------------------------------------------------------------------
  async loadStudents(classId = '') {
    try {
      const url = classId ? `/api/v1/management/teacher/students?class_id=${classId}` : `/api/v1/management/teacher/students`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success || !data.data) return;

      this.studentsCache = data.data;
      this.renderStudentsTable(this.studentsCache);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  },

  renderStudentsTable(list) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No students found for this class.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(s => `
      <tr>
        <td><strong>${s.roll_no}</strong></td>
        <td>${s.full_name}</td>
        <td><code>${s.student_code}</code></td>
        <td><span class="badge badge-info">${s.class_name}</span></td>
        <td>${s.division || 'A'}</td>
        <td>Sem ${s.semester || '5'}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:60px; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
              <div style="width:${s.attendance_percentage || 0}%; height:100%; background:${(s.attendance_percentage >= 75) ? 'var(--admin-success)' : 'var(--admin-danger)'};"></div>
            </div>
            <strong>${s.attendance_percentage || 0}%</strong>
          </div>
        </td>
        <td>
          <span class="badge ${(s.academic_alerts === 'Clear') ? 'badge-success' : 'badge-danger'}">
            ${s.academic_alerts}
          </span>
        </td>
        <td style="color:var(--admin-muted); font-size:12px;">${s.email || '-'}</td>
      </tr>
    `).join('');
  },

  filterStudents(query) {
    const q = query.toLowerCase();
    const filtered = this.studentsCache.filter(s => 
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
      (s.student_code && s.student_code.toLowerCase().includes(q))
    );
    this.renderStudentsTable(filtered);
  },

  // --------------------------------------------------------------------------
  // 4. CLASSES & CURRICULUM
  // --------------------------------------------------------------------------
  async loadClasses() {
    try {
      const res = await fetch('/api/v1/management/reports/classes');
      const data = await res.json();
      if (!data.success || !data.data) return;

      const tbody = document.getElementById('classesReportTbody');
      if (tbody) {
        tbody.innerHTML = data.data.map(c => `
          <tr>
            <td><strong>${c.class_name}</strong></td>
            <td><code>${c.short_code}</code></td>
            <td>Semester ${c.semester}</td>
            <td>${c.division}</td>
            <td><strong>${c.total_enrolled_students} Students</strong></td>
            <td><span class="badge badge-info">${c.average_attendance}%</span></td>
            <td>${c.assigned_teachers_count} Assigned Faculty</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading classes report:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 5. LEAVE APPROVALS WORKFLOW
  // --------------------------------------------------------------------------
  async loadLeaveRequests(status = 'pending') {
    try {
      const url = `/api/v1/management/leave/requests?status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success || !data.data) return;

      const tbody = document.getElementById('leaveRequestsTableBody');
      if (tbody) {
        if (data.data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--admin-muted);">No ${status} leave requests found.</td></tr>`;
          return;
        }

        tbody.innerHTML = data.data.map(l => `
          <tr>
            <td><strong>${l.faculty_name}</strong></td>
            <td>${l.emp_code}</td>
            <td><span class="badge badge-info">${l.leave_type}</span></td>
            <td>${l.start_date}</td>
            <td>${l.end_date}</td>
            <td><strong>${l.total_days} days</strong></td>
            <td style="max-width: 200px; font-size:12px;">${l.reason}</td>
            <td>
              <span class="badge ${l.status === 'approved' ? 'badge-success' : (l.status === 'rejected' ? 'badge-danger' : 'badge-warning')}">
                ${l.status}
              </span>
            </td>
            <td style="font-size:12px; color:var(--admin-muted);">${l.reviewer_remarks || '-'}</td>
            <td>
              ${l.status === 'pending' ? `
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-success btn-sm" onclick="AdminController.openReviewLeaveModal('${l.leave_id}', '${l.faculty_name}', '${l.leave_type}', '${l.total_days}', 'approved')">Approve</button>
                  <button class="btn btn-danger btn-sm" onclick="AdminController.openReviewLeaveModal('${l.leave_id}', '${l.faculty_name}', '${l.leave_type}', '${l.total_days}', 'rejected')">Reject</button>
                </div>
              ` : `<span style="font-size:12px; color:var(--admin-muted);">Processed</span>`}
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading leave requests:', err);
    }
  },

  openReviewLeaveModal(leaveId, facultyName, leaveType, days, status) {
    document.getElementById('modalLeaveId').value = leaveId;
    document.getElementById('modalLeaveStatus').value = status;
    document.getElementById('modalLeaveTitle').textContent = (status === 'approved' ? 'Approve' : 'Reject') + ' Leave Request';
    document.getElementById('modalLeaveDetails').innerHTML = `
      <strong>Faculty:</strong> ${facultyName}<br>
      <strong>Application:</strong> ${days} Day(s) of ${leaveType} leave.<br>
      <strong>Decision:</strong> Proceeding to mark this request as <span style="font-weight:700; text-transform:uppercase;">${status}</span>.
    `;
    const btn = document.getElementById('modalLeaveSubmitBtn');
    if (status === 'approved') {
      btn.className = 'btn btn-success';
      btn.textContent = 'Approve Application';
    } else {
      btn.className = 'btn btn-danger';
      btn.textContent = 'Reject Application';
    }
    document.getElementById('modalLeaveRemarks').value = '';
    document.getElementById('leaveReviewModal').classList.add('open');
  },

  async submitLeaveReview() {
    const leaveId = document.getElementById('modalLeaveId').value;
    const status = document.getElementById('modalLeaveStatus').value;
    const remarks = document.getElementById('modalLeaveRemarks').value;

    try {
      const res = await fetch('/api/v1/management/leave/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_id: leaveId,
          reviewed_by: 'EMP-CSE-1001',
          status: status,
          remarks: remarks || (status === 'approved' ? 'Approved by Administration' : 'Rejected due to academic commitments')
        })
      });
      const data = await res.json();
      if (data.success) {
        this.closeModal('leaveReviewModal');
        this.loadLeaveRequests(document.getElementById('leaveStatusFilter').value || 'pending');
        this.loadDashboardOverview();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error submitting leave review:', err);
      alert('Error updating leave');
    }
  },

  // --------------------------------------------------------------------------
  // 6. ATTENDANCE LOCK GOVERNANCE
  // --------------------------------------------------------------------------
  async loadAttendanceGovernance() {
    try {
      const res = await fetch('/api/v1/attendance/summary');
      const data = await res.json();
      const sessions = (data.success && data.data && data.data.recent_sessions) ? data.data.recent_sessions : [];

      const tbody = document.getElementById('attendanceGovernanceTbody');
      if (tbody) {
        if (sessions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No recent attendance sessions found.</td></tr>';
          return;
        }

        tbody.innerHTML = sessions.map(s => `
          <tr>
            <td><code>${s.session_code}</code></td>
            <td><strong>${s.class_name}</strong></td>
            <td>${s.subject_name || s.subject_code}</td>
            <td>${s.session_date}</td>
            <td><strong>${s.attendance_rate}%</strong></td>
            <td>
              <span class="badge ${s.status === 'locked' ? 'badge-danger' : (s.status === 'submitted' ? 'badge-warning' : 'badge-success')}">
                ${s.status || 'approved'}
              </span>
            </td>
            <td>
              ${s.status === 'locked' ? `
                <button class="btn btn-outline btn-sm" onclick="AdminController.unlockAttendance('${s.id}')">
                  <i data-lucide="unlock"></i> Unlock Session
                </button>
              ` : `
                <button class="btn btn-primary btn-sm" onclick="AdminController.approveAndLockAttendance('${s.id}')">
                  <i data-lucide="lock"></i> Approve &amp; Lock
                </button>
              `}
            </td>
          </tr>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (err) {
      console.error('Error loading attendance governance:', err);
    }
  },

  async approveAndLockAttendance(sessionId) {
    if (!confirm('Are you sure you want to approve and lock this attendance session? Locked sessions cannot be edited by teachers.')) return;
    try {
      const res = await fetch('/api/v1/management/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, approved_by: 'b319e831-c312-402f-89a7-d273c86f18c4' })
      });
      const data = await res.json();
      if (data.success) {
        this.loadAttendanceGovernance();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error locking attendance:', err);
    }
  },

  async unlockAttendance(sessionId) {
    const reason = prompt('Please enter the justification for unlocking this attendance session:');
    if (!reason) return;
    try {
      const res = await fetch('/api/v1/management/attendance/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, reason: reason })
      });
      const data = await res.json();
      if (data.success) {
        this.loadAttendanceGovernance();
      } else {
        alert(data.message || 'Unlock failed');
      }
    } catch (err) {
      console.error('Error unlocking attendance:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 7. INSTITUTIONAL REPORTS
  // --------------------------------------------------------------------------
  async loadReports() {
    try {
      const facRes = await fetch('/api/v1/management/reports/faculty');
      const facData = await facRes.json();
      const facTbody = document.getElementById('reportFacultyTbody');
      if (facTbody && facData.data) {
        facTbody.innerHTML = facData.data.map(f => `
          <tr>
            <td><strong>${f.full_name}</strong><br><small style="color:var(--admin-muted);">${f.emp_code}</small></td>
            <td>${f.designation}</td>
            <td><strong>${f.total_weekly_hours} hrs/wk</strong></td>
          </tr>
        `).join('');
      }

      const clsRes = await fetch('/api/v1/management/reports/classes');
      const clsData = await clsRes.json();
      const clsTbody = document.getElementById('reportClassTbody');
      if (clsTbody && clsData.data) {
        clsTbody.innerHTML = clsData.data.map(c => `
          <tr>
            <td><strong>${c.class_name}</strong></td>
            <td>${c.total_enrolled_students}</td>
            <td><strong>${c.average_attendance}%</strong></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  },

  exportReport(type) {
    alert(`Generating official ${type.toUpperCase()} report CSV download...`);
  },

  // --------------------------------------------------------------------------
  // 7B. RESULTS & ACADEMIC RECORDS GOVERNANCE
  // --------------------------------------------------------------------------
  getAuthHeaders() {
    const token = localStorage.getItem('ssgmce_admin_token') ||
                  localStorage.getItem('ssgmce_access_token') ||
                  localStorage.getItem('ssgmce_token') ||
                  sessionStorage.getItem('ssgmce_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async loadResultsGovernance() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);
    const subjectId = document.getElementById('adminResultsSubSelect')?.value || 'CS501';

    try {
      const res = await fetch(`/api/v1/results/marks/roster?class_id=${encodeURIComponent(classId)}&subject_id=${encodeURIComponent(subjectId)}&semester=${semester}`, {
        headers: this.getAuthHeaders()
      }).then(r => r.json());

      if (res && res.success && res.data) {
        const d = res.data;
        const students = d.students || [];
        const isLocked = Boolean(d.is_locked);
        const statusVal = d.status || 'NEW';

        let gradedCount = 0;
        let passCount = 0;
        students.forEach(s => {
          if (s.total_marks !== null) gradedCount++;
          if (s.result_status === 'PASS') passCount++;
        });

        const passRate = gradedCount > 0 ? ((passCount / gradedCount) * 100).toFixed(1) + '%' : '—';

        document.getElementById('adminStatEnrolled').textContent = students.length;
        document.getElementById('adminStatGraded').textContent = gradedCount;
        document.getElementById('adminStatPassRate').textContent = passRate;

        const statLock = document.getElementById('adminStatLockStatus');
        if (statLock) {
          statLock.textContent = isLocked ? 'LOCKED 🔒' : statusVal;
          statLock.style.color = isLocked ? '#dc2626' : (statusVal === 'SUBMITTED' ? '#0b5cad' : '#059669');
        }
      }
    } catch (err) {
      console.warn('Error fetching results governance stats:', err);
    }

    // Simultaneously load revaluation applications and institutional reports
    await Promise.all([
      this.loadRevaluationDesk(),
      this.loadClassReport(classId, semester),
      this.loadBacklogReport(classId, semester)
    ]);
  },

  async verifyMarksSubmission() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);
    const subjectId = document.getElementById('adminResultsSubSelect')?.value || 'CS501';

    if (!confirm(`Verify and seal marks submission for Class ${classId} - ${subjectId} (Semester ${semester})?`)) return;

    try {
      const res = await fetch('/api/v1/results/marks/verify', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          notes: 'Autonomous Examination Cell Verification Complete'
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert('✅ Marks submission verified and sealed by Examination Authority.');
        await this.loadResultsGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error verifying marks.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  async publishResults() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);

    if (!confirm(`Are you sure you want to PUBLISH official results for Class ${classId} (Semester ${semester}) to all student portals?`)) return;

    try {
      const res = await fetch('/api/v1/results/publish', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_name: classId,
          semester: semester,
          reason: 'Autonomous End-Semester Examination Official Declaration'
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert(`✅ Academic results for Class ${classId} (Sem ${semester}) are now declared and published!`);
        await this.loadResultsGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error publishing results.');
      }
    } catch (err) {
      alert(`Publication error: ${err.message}`);
    }
  },

  async unpublishResults() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);

    if (!confirm(`Withhold results for Class ${classId} (Semester ${semester}) from student portals?`)) return;

    try {
      const res = await fetch('/api/v1/results/unpublish', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_name: classId,
          semester: semester,
          reason: 'Administrative hold / Mark revision in progress'
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert(`⚠️ Results for Class ${classId} have been withheld from student view.`);
        await this.loadResultsGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error withholding results.');
      }
    } catch (err) {
      alert(`Unpublish error: ${err.message}`);
    }
  },

  openUnlockMarksModal() {
    document.getElementById('modalUnlockReason').value = '';
    document.getElementById('adminUnlockMarksModal').classList.add('open');
  },

  async submitUnlockMarks() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);
    const subjectId = document.getElementById('adminResultsSubSelect')?.value || 'CS501';
    const reason = document.getElementById('modalUnlockReason')?.value?.trim();

    if (!reason) {
      alert('Mandatory unlock justification reason is required for institutional audit logging.');
      return;
    }

    try {
      const res = await fetch('/api/v1/results/marks/unlock', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          semester: semester,
          reason: reason
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert('🔓 Marks submission successfully unlocked. Faculty may now edit entries.');
        this.closeModal('adminUnlockMarksModal');
        await this.loadResultsGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error unlocking marks.');
      }
    } catch (err) {
      alert(`Unlock error: ${err.message}`);
    }
  },

  async loadRevaluationDesk() {
    const tbody = document.getElementById('adminRevalTbody');
    if (!tbody) return;

    try {
      const res = await fetch('/api/v1/results/revaluation', {
        headers: this.getAuthHeaders()
      }).then(r => r.json());

      const list = (res && res.success && res.data) ? res.data : [];
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:16px;">No revaluation applications pending.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(r => `
        <tr>
          <td><code style="font-size:11px;">${r.id.substring(0, 8)}...</code></td>
          <td><strong>${r.student_code}</strong></td>
          <td><strong>${r.subject_code}</strong></td>
          <td>Sem ${r.semester_number}</td>
          <td>${r.previous_external_marks} / 70</td>
          <td>${r.revised_external_marks !== null ? `<strong>${r.revised_external_marks} / 70</strong>` : '—'}</td>
          <td>
            <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">
              ${r.status}
            </span>
          </td>
          <td style="font-size:12px; max-width:200px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${r.reason}">
            ${r.reason || '—'}
          </td>
          <td>
            ${r.status === 'PENDING' ? `
              <button class="btn btn-outline btn-sm" onclick="AdminController.openRevalReviewModal('${r.id}', '${r.student_code}', '${r.subject_code}', ${r.previous_external_marks}, '${encodeURIComponent(r.reason || '')}')">
                Review
              </button>
            ` : `<span style="font-size:12px; color:var(--admin-muted);">Completed</span>`}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.warn('Error loading revaluation applications:', err);
    }
  },

  openRevalReviewModal(appId, studentCode, subjectCode, prevMarks, encodedReason) {
    document.getElementById('modalRevalId').value = appId;
    document.getElementById('modalRevalNewMarks').value = prevMarks;
    document.getElementById('modalRevalRemarks').value = '';

    const reason = decodeURIComponent(encodedReason || '');
    const infoBox = document.getElementById('modalRevalInfoBox');
    if (infoBox) {
      infoBox.innerHTML = `
        <strong>Candidate:</strong> ${studentCode} &bull; <strong>Course:</strong> ${subjectCode}<br>
        <strong>Current External Marks (ESE):</strong> ${prevMarks} / 70<br>
        <strong>Student Appeal Reason:</strong> <em>${reason || 'Answer script re-checking'}</em>
      `;
    }

    document.getElementById('revalReviewModal').classList.add('open');
  },

  async submitRevalDecision(decision) {
    const appId = document.getElementById('modalRevalId')?.value;
    const newMarks = parseFloat(document.getElementById('modalRevalNewMarks')?.value);
    const remarks = document.getElementById('modalRevalRemarks')?.value?.trim();

    if (decision === 'APPROVED' && (isNaN(newMarks) || newMarks < 0 || newMarks > 70)) {
      alert('Please enter valid revised external marks between 0 and 70.');
      return;
    }

    try {
      const res = await fetch('/api/v1/results/revaluation/review', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          request_id: appId,
          status: decision,
          revised_external_marks: decision === 'APPROVED' ? newMarks : null,
          review_remarks: remarks || (decision === 'APPROVED' ? 'Approved by examination evaluation committee' : 'Rejected after answer book scrutiny')
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert(`✅ Revaluation decision (${decision}) recorded successfully! Grades recalculated.`);
        this.closeModal('revalReviewModal');
        await this.loadResultsGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error recording revaluation decision.');
      }
    } catch (err) {
      alert(`Decision recording error: ${err.message}`);
    }
  },

  async loadClassReport(className, semester) {
    const container = document.getElementById('classReportContainer');
    if (!container) return;

    try {
      const res = await fetch(`/api/v1/results/reports/class?class_name=${encodeURIComponent(className)}&semester=${semester}`).then(r => r.json());
      if (res && res.success && res.data) {
        const d = res.data;
        container.innerHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
            <div><strong>Total Evaluated:</strong> ${d.total_students} candidates</div>
            <div><strong>Pass Rate:</strong> <span style="color:#059669; font-weight:700;">${d.pass_percentage}%</span></div>
            <div><strong>Average SGPA:</strong> ${d.average_sgpa}</div>
            <div><strong>Distinction Rate:</strong> ${d.distinction_count || 0} students</div>
            <div><strong>Highest SGPA:</strong> <span style="color:var(--admin-primary); font-weight:700;">${d.highest_sgpa}</span></div>
            <div><strong>Lowest SGPA:</strong> ${d.lowest_sgpa}</div>
          </div>
          <div style="font-size:12px; color:var(--admin-muted);">
            Autonomous curriculum standard: All passing candidates cleared with UGC 10-point scale.
          </div>
        `;
      }
    } catch (err) {
      console.warn('Class report load error:', err);
    }
  },

  async loadBacklogReport(className, semester) {
    const container = document.getElementById('backlogReportContainer');
    if (!container) return;

    try {
      const res = await fetch(`/api/v1/results/reports/backlogs?class_name=${encodeURIComponent(className)}&semester=${semester}`).then(r => r.json());
      if (res && res.success && res.data) {
        const d = res.data;
        const count = d.total_backlog_records || 0;
        if (count === 0) {
          container.innerHTML = `
            <div style="text-align:center; padding:16px;">
              <span style="font-size:28px; color:#10b981;">✓</span>
              <h4 style="margin:6px 0; color:var(--admin-navy);">Zero Institutional Backlogs</h4>
              <p style="font-size:12px; color:var(--admin-muted); margin:0;">All candidates in Class ${className} (Semester ${semester}) have passed all autonomous examinations.</p>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="padding:10px;">
              <strong style="color:#b91c1c;">${count} Backlog Case(s) Identified:</strong>
              <ul style="margin:8px 0; padding-left:20px; font-size:12.5px;">
                ${(d.records || []).slice(0, 5).map(b => `
                  <li><strong>${b.student_code}</strong> (${b.student_name}): ${b.failed_subject_code} - ${b.failed_subject_name} (Total: ${b.total_marks})</li>
                `).join('')}
              </ul>
            </div>
          `;
        }
      }
    } catch (err) {
      console.warn('Backlog report load error:', err);
    }
  },

  exportResultsGazette() {
    const classId = document.getElementById('adminResultsClassSelect')?.value || '3R';
    const semester = parseInt(document.getElementById('adminResultsSemSelect')?.value || 5);
    alert(`Downloading Official Autonomous Results Gazette (CSV with UTF-8 BOM) for Class ${classId} Sem ${semester}...`);
    window.location.href = `/api/v1/results/export?class_name=${encodeURIComponent(classId)}&semester=${semester}`;
  },

  // --------------------------------------------------------------------------
  // 8. RBAC MATRIX
  // --------------------------------------------------------------------------
  async loadRBAC() {
    try {
      const res = await fetch('/api/v1/management/rbac/matrix');
      const data = await res.json();
      if (!data.success || !data.data) return;

      const roles = data.data.roles || [];
      const perms = data.data.permissions || [];

      const rolesContainer = document.getElementById('rolesList');
      if (rolesContainer) {
        rolesContainer.innerHTML = roles.map(r => `
          <div style="background:#FFFFFF; border:1px solid var(--admin-border); padding:12px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--admin-navy);">${r.display_name}</strong>
              <span class="badge badge-info">${r.name}</span>
            </div>
            <p style="font-size:12px; color:var(--admin-muted); margin:4px 0 0;">${r.description || ''}</p>
          </div>
        `).join('');
      }

      const permsTbody = document.getElementById('permissionsTbody');
      if (permsTbody) {
        permsTbody.innerHTML = perms.map(p => `
          <tr>
            <td><code>${p.permission_key}</code></td>
            <td><strong>${p.name}</strong><br><small style="color:var(--admin-muted);">${p.description || ''}</small></td>
            <td><span class="badge badge-secondary">${p.category}</span></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading RBAC matrix:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 9. AUDIT TRAIL
  // --------------------------------------------------------------------------
  async loadAuditLogs() {
    try {
      const res = await fetch('/api/v1/management/audit/logs?limit=50');
      const data = await res.json();
      if (!data.success || !data.data) return;

      const tbody = document.getElementById('auditLogsTbody');
      if (tbody) {
        if (data.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No audit events recorded yet.</td></tr>';
          return;
        }

        tbody.innerHTML = data.data.map(a => `
          <tr>
            <td style="white-space:nowrap; font-size:12px; color:var(--admin-muted);">
              ${new Date(a.created_at).toLocaleString()}
            </td>
            <td><strong>${a.action}</strong></td>
            <td><span class="badge badge-secondary">${a.module}</span></td>
            <td><span class="badge badge-info">${a.actor_role}</span></td>
            <td style="font-size:12px;">
              ${a.reason ? `<em>${a.reason}</em>` : JSON.stringify(a.new_data || {})}
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 10. FEES & FINANCIAL GOVERNANCE
  // --------------------------------------------------------------------------
  async loadFeesGovernance() {
    try {
      await Promise.all([
        this.loadClassFeeCollection(),
        this.loadPendingFees()
      ]);
    } catch (err) {
      console.error('Error loading fees governance:', err);
    }
  },

  async loadClassFeeCollection() {
    try {
      const res = await fetch('/api/v1/fees/reports/class-collection', {
        headers: this.getAuthHeaders()
      }).then(r => r.json());

      const tbody = document.getElementById('classFeeCollectionTbody');
      if (res && res.success && res.data) {
        let totalCollected = 0;
        let totalExpected = 0;

        tbody.innerHTML = res.data.map(c => {
          totalCollected += (c.total_collected || 0);
          totalExpected += (c.total_expected || 0);
          return `
            <tr>
              <td><strong>${c.class_name}</strong></td>
              <td>${c.total_students}</td>
              <td>₹${Number(c.total_expected || 0).toLocaleString('en-IN')}</td>
              <td style="color:#059669; font-weight:600;">₹${Number(c.total_collected || 0).toLocaleString('en-IN')}</td>
              <td style="color:${(c.total_pending || 0) > 0 ? '#dc2626' : '#64748b'}; font-weight:600;">₹${Number(c.total_pending || 0).toLocaleString('en-IN')}</td>
              <td><span class="badge ${c.collection_percentage >= 80 ? 'badge-success' : (c.collection_percentage >= 50 ? 'badge-warning' : 'badge-danger')}">${c.collection_percentage}%</span></td>
            </tr>
          `;
        }).join('');

        const collEl = document.getElementById('kpiCollectedFees');
        if (collEl) collEl.textContent = '₹' + Math.round(totalCollected).toLocaleString('en-IN');
      }
    } catch (err) {
      console.error('Error loading class fee collection:', err);
    }
  },

  async loadPendingFees() {
    const classFilter = document.getElementById('adminFeeClassFilter')?.value || '';
    const url = classFilter ? `/api/v1/fees/pending?class_name=${encodeURIComponent(classFilter)}` : '/api/v1/fees/pending';
    const tbody = document.getElementById('pendingFeesTbody');

    try {
      const res = await fetch(url, { headers: this.getAuthHeaders() }).then(r => r.json());
      if (res && res.success && res.data) {
        const pData = res.data;
        const pendEl = document.getElementById('kpiPendingFees');
        const defEl = document.getElementById('kpiDefaultersCount');
        if (pendEl) pendEl.textContent = '₹' + Math.round(pData.total_pending_amount || 0).toLocaleString('en-IN');
        if (defEl) defEl.textContent = pData.total_defaulters || 0;

        if (!pData.records || pData.records.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:var(--admin-muted);">No pending fee records found.</td></tr>';
          return;
        }

        tbody.innerHTML = pData.records.map(r => `
          <tr>
            <td><code>${r.student_code}</code></td>
            <td><strong>${r.student_name}</strong></td>
            <td><span class="badge badge-secondary">${r.class_name}</span></td>
            <td><small style="color:var(--admin-muted);">${r.invoice_number}</small></td>
            <td>₹${Number(r.total_amount).toLocaleString('en-IN')}</td>
            <td style="color:#059669; font-weight:600;">₹${Number(r.paid_amount).toLocaleString('en-IN')}</td>
            <td style="color:#dc2626; font-weight:700;">₹${Number(r.pending_amount).toLocaleString('en-IN')}</td>
            <td><small>${r.due_date}</small></td>
            <td><span class="badge ${r.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'}">${r.status}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="AdminController.openRecordPaymentModal('${r.student_code}', '${r.invoice_number}', ${r.pending_amount})">
                Record Payment
              </button>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading pending fees:', err);
    }
  },

  openCreateInvoiceModal() {
    const el = document.getElementById('adminCreateInvoiceModal');
    if (el) el.classList.add('open');
  },

  async submitCreateInvoice() {
    const studentCode = document.getElementById('modalInvStudentCode')?.value?.trim();
    if (!studentCode) {
      alert('Please enter student PRN / code.');
      return;
    }

    const payload = {
      student_code: studentCode,
      academic_year: document.getElementById('modalInvYear')?.value || '2026-27',
      semester: parseInt(document.getElementById('modalInvSemester')?.value || 5),
      subtotal: parseFloat(document.getElementById('modalInvSubtotal')?.value || 118500),
      scholarship_amount: parseFloat(document.getElementById('modalInvScholarship')?.value || 0),
      discount_amount: parseFloat(document.getElementById('modalInvDiscount')?.value || 0),
      due_date: document.getElementById('modalInvDueDate')?.value || '2026-11-30'
    };

    try {
      const res = await fetch('/api/v1/fees/invoices', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res && res.success) {
        alert(`✅ Invoice created successfully: ${res.data.invoice_number}`);
        this.closeModal('adminCreateInvoiceModal');
        await this.loadFeesGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error creating invoice.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  openRecordPaymentModal(studentCode = '', invoiceId = '', pendingAmt = '') {
    if (studentCode) {
      document.getElementById('modalPayStudentCode').value = studentCode;
    }
    if (invoiceId) {
      document.getElementById('modalPayInvoiceId').value = invoiceId;
    }
    if (pendingAmt) {
      document.getElementById('modalPayAmount').value = pendingAmt;
    }
    const el = document.getElementById('adminRecordPaymentModal');
    if (el) el.classList.add('open');
  },

  async submitRecordPayment() {
    const studentCode = document.getElementById('modalPayStudentCode')?.value?.trim();
    const amount = parseFloat(document.getElementById('modalPayAmount')?.value);
    const method = document.getElementById('modalPayMethod')?.value || 'cash';
    const ref = document.getElementById('modalPayRef')?.value?.trim();
    const invoiceId = document.getElementById('modalPayInvoiceId')?.value || null;

    if (!studentCode || !amount || amount <= 0) {
      alert('Please enter valid student PRN and payment amount.');
      return;
    }

    try {
      const res = await fetch('/api/v1/fees/payments/record', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          student_code: studentCode,
          amount: amount,
          payment_method: method,
          payment_reference: ref || `OFFLINE-${Date.now()}`,
          invoice_id: invoiceId
        })
      }).then(r => r.json());

      if (res && res.success) {
        alert(`✅ Offline payment recorded! Receipt: ${res.data.receipt_number}`);
        this.closeModal('adminRecordPaymentModal');
        await this.loadFeesGovernance();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error recording payment.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  exportFeeReport() {
    const classFilter = document.getElementById('adminFeeClassFilter')?.value || '';
    const url = classFilter ? `/api/v1/fees/export?class_name=${encodeURIComponent(classFilter)}` : '/api/v1/fees/export';
    window.open(url, '_blank');
  },

  // --------------------------------------------------------------------------
  // 11. DIGITAL DOCUMENT VERIFICATION DESK
  // --------------------------------------------------------------------------
  async loadDocumentDesk() {
    const status = document.getElementById('adminDocStatusFilter')?.value || '';
    const classFilter = document.getElementById('adminDocClassFilter')?.value || '';
    const search = document.getElementById('adminDocSearchInput')?.value?.trim() || '';

    let url = '/api/v1/documents/admin/list?';
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (classFilter) url += `class_name=${encodeURIComponent(classFilter)}&`;
    if (search) url += `student_code=${encodeURIComponent(search)}&`;

    const tbody = document.getElementById('adminDocumentsTbody');

    try {
      const res = await fetch(url, { headers: this.getAuthHeaders() }).then(r => r.json());
      if (res && res.success && res.data) {
        const docs = res.data;
        const pendingDocs = docs.filter(d => !d.verified && d.status !== 'rejected').length;
        const badge = document.getElementById('badgePendingDocs');
        if (badge) {
          badge.textContent = pendingDocs;
          badge.style.display = pendingDocs > 0 ? 'inline-block' : 'none';
        }

        if (docs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--admin-muted);">No documents found for selected filter criteria.</td></tr>';
          return;
        }

        tbody.innerHTML = docs.map(d => `
          <tr>
            <td><code>${d.student_code}</code></td>
            <td><strong>${d.student_name}</strong></td>
            <td><span class="badge badge-secondary">${d.class_name}</span></td>
            <td><small>${d.document_type || 'other'}</small></td>
            <td>
              <strong>${d.document_title}</strong>
              ${d.description ? `<br><small style="color:var(--admin-muted);">${d.description}</small>` : ''}
            </td>
            <td><small>${Math.round((d.file_size || 0)/1024)} KB</small></td>
            <td><small style="color:var(--admin-muted);">${d.created_at ? d.created_at.substring(0, 10) : ''}</small></td>
            <td>
              <span class="badge ${d.verified ? 'badge-success' : (d.status === 'rejected' ? 'badge-danger' : 'badge-warning')}">
                ${d.verified ? 'Verified ✓' : (d.status === 'rejected' ? 'Rejected' : 'Pending')}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="AdminController.viewDocument('${d.signed_url ? d.signed_url.replace(/'/g, "\\'") : ''}', '${d.id}')" title="Secure View">
                  View
                </button>
                ${!d.verified ? `
                  <button class="btn btn-primary btn-sm" style="background:#059669; border-color:#059669;" onclick="AdminController.verifyDocument('${d.id}', '${d.document_title.replace(/'/g, "\\'")}')" title="Verify & Seal">
                    Verify
                  </button>
                  <button class="btn btn-outline btn-sm" style="color:#dc2626; border-color:#dc2626;" onclick="AdminController.openRejectDocModal('${d.id}', '${d.document_title.replace(/'/g, "\\'")}')" title="Reject">
                    Reject
                  </button>
                ` : ''}
                <button class="btn btn-outline btn-sm" style="color:#94a3b8;" onclick="AdminController.deleteDocument('${d.id}', '${d.document_title.replace(/'/g, "\\'")}')" title="Delete">
                  &times;
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading document desk:', err);
    }
  },

  viewDocument(signedUrl, docId) {
    if (signedUrl && signedUrl.startsWith('http')) {
      window.open(signedUrl, '_blank');
      return;
    }
    window.open(`/api/v1/documents/${docId}/download`, '_blank');
  },

  async verifyDocument(docId, docTitle) {
    if (!confirm(`Mark document "${docTitle}" as officially VERIFIED?`)) return;

    try {
      const res = await fetch(`/api/v1/documents/${docId}/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ notes: 'Verified by Institutional Authority' })
      }).then(r => r.json());

      if (res && res.success) {
        alert('✅ Document verified and recorded in audit log.');
        await this.loadDocumentDesk();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error verifying document.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  openRejectDocModal(docId, docTitle) {
    document.getElementById('modalRejectDocId').value = docId;
    document.getElementById('modalRejectDocTitle').textContent = `"${docTitle}"`;
    document.getElementById('modalRejectDocReason').value = '';
    const el = document.getElementById('adminRejectDocModal');
    if (el) el.classList.add('open');
  },

  async submitRejectDocument() {
    const docId = document.getElementById('modalRejectDocId')?.value;
    const reason = document.getElementById('modalRejectDocReason')?.value?.trim();

    if (!reason) {
      alert('Mandatory: Please provide a reason for rejecting the document.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/documents/${docId}/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason: reason })
      }).then(r => r.json());

      if (res && res.success) {
        alert('✅ Document rejected and audit log recorded.');
        this.closeModal('adminRejectDocModal');
        await this.loadDocumentDesk();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error rejecting document.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  async deleteDocument(docId, docTitle) {
    if (!confirm(`Are you sure you want to permanently DELETE "${docTitle}" from storage and database?`)) return;

    try {
      const res = await fetch(`/api/v1/documents/${docId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      }).then(r => r.json());

      if (res && res.success) {
        alert('✅ Document permanently removed.');
        await this.loadDocumentDesk();
      } else {
        alert((res && res.error && res.error.message) || res.message || 'Error deleting document.');
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    }
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminController.init();
});
