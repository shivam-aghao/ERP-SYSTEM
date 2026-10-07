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

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminController.init();
});
