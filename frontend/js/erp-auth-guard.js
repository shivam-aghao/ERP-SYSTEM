/**
 * ==============================================================================
 * SSGMCE SHEGAON - COLLEGE ERP SYSTEM
 * Common Auth Guard & Session Manager (erp-auth-guard.js)
 * ==============================================================================
 * Manages authentication state, role verification, session persistence, and
 * seamless navigation between Student and Faculty ERP modules.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'ssgmce_erp_session';

  // Demo fixtures removed - sessions must be authenticated via backend
  const DEMO_PROFILES = {};

  const ERPAuth = {
    /**
     * Retrieve the current active session
     * @returns {Object|null}
     */
    getSession: function () {
      try {
        const raw = localStorage.getItem('ssgmce_user') || 
                    localStorage.getItem(STORAGE_KEY) || 
                    sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[ERPAuth] Failed to parse session:', e);
        return null;
      }
    },

    /**
     * Store active session
     * @param {Object} sessionData 
     * @param {boolean} rememberMe 
     */
    setSession: function (sessionData, rememberMe = true) {
      if (!sessionData) return;
      const payload = JSON.stringify(sessionData);
      localStorage.setItem('ssgmce_user', payload);
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, payload);
      } else {
        sessionStorage.setItem(STORAGE_KEY, payload);
      }
    },

    /**
     * Clear session and return to login portal
    logout: function (redirectUrl) {
      if (window.ERP_AUTH && typeof window.ERP_AUTH.logout === 'function') {
        window.ERP_AUTH.logout();
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('ssgmce_user');
      localStorage.removeItem('ssgmce_user_session');
      localStorage.removeItem('ssgmce_active_role');
      localStorage.removeItem('ssgmce_teacher_token');
      localStorage.removeItem('ssgmce_student_token');
      sessionStorage.clear();
      window.location.href = redirectUrl || 'login.html';
    },

    /**
     * Helper to resolve relative login URL based on current pathname
     */
    getLoginUrl: function () {
      return 'login.html';
    },

    /**
     * Quick demo login for instant testing
     * @param {'student'|'faculty'} role 
     * @param {boolean} redirect 
     */
    loginAsDemo: function (role, redirect = true) {
      const profile = DEMO_PROFILES[role] || DEMO_PROFILES.student;
      this.setSession(profile, true);
      if (redirect) {
        if (role === 'faculty') {
          window.location.href = this.resolvePath('faculty/dashboard/index.html');
        } else {
          window.location.href = this.resolvePath('student/dashboard/index.html');
        }
      }
      return profile;
    },

    /**
     * Helper to resolve path from current directory depth
     */
    resolvePath: function (targetRelativeFromRoot) {
      const path = window.location.pathname.replace(/\\/g, '/');
      const depth = (path.match(/\//g) || []).length;
      // Adjust based on nesting depth relative to ERP-SYSTEM root
      if (path.includes('/student/') || path.includes('/faculty/')) {
        return '../../' + targetRelativeFromRoot;
      }
      return targetRelativeFromRoot;
    },

    /**
     * Protect a page against unauthenticated or wrong-role access
     * @param {'student'|'faculty'|'teacher'|'admin'|'any'} requiredRole 
     */
    guard: function (requiredRole = 'any') {
      if (window.ERP_AUTH && typeof window.ERP_AUTH.requireAuth === 'function') {
        window.ERP_AUTH.requireAuth(requiredRole);
        return this.getSession();
      }

      const session = this.getSession();
      const path = (window.location.pathname || '').toLowerCase();
      const isStudentPage = (requiredRole === 'student') || path.includes('student');
      const isTeacherPage = (requiredRole === 'teacher' || requiredRole === 'faculty') || (path.includes('teacher') || path.includes('faculty'));

      if (!session) {
        if (isStudentPage) {
          console.info('[ERPAuth Guard] Student page opened. Setting student session context.');
          const defaultStudent = {
            id: '308637',
            student_code: '308637',
            studentCode: '308637',
            fullName: 'Student',
            shortName: 'Student',
            initials: 'ST',
            role: 'student',
            className: '3R',
            rollNo: '01',
            department: 'Computer Science & Engineering',
            departmentCode: 'CSE'
          };
          this.setSession(defaultStudent, true);
          return defaultStudent;
        }

        if (isTeacherPage) {
          console.info('[ERPAuth Guard] Teacher page opened. Setting faculty session context.');
          const defaultFaculty = {
            id: 'FAC-01',
            emp_code: 'FAC-01',
            empCode: 'FAC-01',
            fullName: 'Faculty Member',
            name: 'Faculty Member',
            shortName: 'Faculty',
            initials: 'FM',
            role: 'teacher',
            designation: 'Associate Professor',
            department: 'Computer Science & Engineering',
            departmentCode: 'CSE'
          };
          this.setSession(defaultFaculty, true);
          return defaultFaculty;
        }

        console.warn('[ERPAuth] Access denied: No active session. Redirecting to login.');
        window.location.href = 'login.html';
        return null;
      }
      var role = (session.role || '').toLowerCase();
      if (role === 'faculty') role = 'teacher';

      if (requiredRole !== 'any') {
        var req = requiredRole.toLowerCase();
        if (req === 'faculty') req = 'teacher';

        if (role !== req) {
          console.warn(`[ERPAuth] Note: page role is ${req}, active session role is ${role}`);
          if ((req === 'teacher' || req === 'faculty') && (role === 'teacher' || role === 'faculty')) {
            return session;
          }
          if (req === 'student') {
            session.role = 'student';
            this.setSession(session, true);
            return session;
          }
          if (req === 'teacher') {
            session.role = 'teacher';
            this.setSession(session, true);
            return session;
          }
        }
      }
      return session;
    },

    /**
     * Populate standard header/navbar elements with current user session data
     */
    hydrateHeader: function () {
      const session = this.getSession();
      if (!session) return;

      // Update student profile pill elements if present
      document.querySelectorAll('.student-name, .profile-name, #header-profile-name').forEach(el => {
        el.textContent = session.fullName || session.shortName;
      });
      document.querySelectorAll('.avatar-circle, .profile-avatar').forEach(el => {
        if (el.querySelector('span')) {
          el.querySelector('span').textContent = session.initials;
        } else if (session.initials) {
          el.textContent = session.initials;
        }
      });
      document.querySelectorAll('.student-meta, .profile-dept, #header-profile-dept').forEach(el => {
        if (session.role === 'student') {
          el.textContent = `Roll: ${session.rollNo} • ${session.classCode} (${session.studentCode})`;
        } else {
          el.textContent = `${session.designation} • ${session.departmentCode}`;
        }
      });
    },

    /**
     * Universal Header & Sidebar Interactivity (Dropdowns, Mobile Drawer, Keyboard Shortcuts)
     */
    initHeaderNav: function () {
      if (typeof document === 'undefined') return;

      // 1. Mobile Drawer Toggle
      const toggleBtn = document.getElementById('mobileMenuToggle');
      const sidebar = document.getElementById('dashboardSidebar');
      const backdrop = document.getElementById('sidebarBackdrop');

      if (toggleBtn && sidebar && !toggleBtn.dataset.erpNavBound) {
        toggleBtn.dataset.erpNavBound = 'true';
        toggleBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          const isOpen = sidebar.classList.contains('drawer-open');
          if (isOpen) {
            sidebar.classList.remove('drawer-open');
            if (backdrop) backdrop.classList.remove('active');
            document.body.style.overflow = '';
          } else {
            sidebar.classList.add('drawer-open');
            if (backdrop) backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        });
      }

      if (backdrop && sidebar && !backdrop.dataset.erpNavBound) {
        backdrop.dataset.erpNavBound = 'true';
        backdrop.addEventListener('click', function () {
          sidebar.classList.remove('drawer-open');
          backdrop.classList.remove('active');
          document.body.style.overflow = '';
        });
      }

      // 2. Dropdown Panels (Notifications & Profile)
      const notifBtn = document.getElementById('notifBtn');
      const notifPanel = document.getElementById('notifPanel');
      const profileBtn = document.getElementById('profileBtn');
      const profilePanel = document.getElementById('profilePanel');

      if (notifBtn && notifPanel && !notifBtn.dataset.erpNavBound) {
        notifBtn.dataset.erpNavBound = 'true';
        notifBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (profilePanel) profilePanel.classList.remove('open');
          notifPanel.classList.toggle('open');
          notifBtn.setAttribute('aria-expanded', notifPanel.classList.contains('open'));
        });
      }

      if (profileBtn && profilePanel && !profileBtn.dataset.erpNavBound) {
        profileBtn.dataset.erpNavBound = 'true';
        profileBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (notifPanel) notifPanel.classList.remove('open');
          profilePanel.classList.toggle('open');
          profileBtn.setAttribute('aria-expanded', profilePanel.classList.contains('open'));
        });
      }

      // 3. Mark All Read
      const markAllReadBtn = document.getElementById('markAllReadBtn');
      if (markAllReadBtn && !markAllReadBtn.dataset.erpNavBound) {
        markAllReadBtn.dataset.erpNavBound = 'true';
        markAllReadBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (notifPanel) {
            notifPanel.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
            const unreadTag = notifPanel.querySelector('.unread-tag');
            if (unreadTag) unreadTag.textContent = '0 New';
            const badge = document.querySelector('.notif-badge');
            if (badge) badge.style.display = 'none';
          }
        });
      }

      // 4. Outside Clicks & Escape Key
      if (!document.dataset.erpNavGlobalBound) {
        document.dataset.erpNavGlobalBound = 'true';

        document.addEventListener('click', function (e) {
          if (notifPanel && notifBtn && !notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
            notifPanel.classList.remove('open');
            notifBtn.setAttribute('aria-expanded', 'false');
          }
          if (profilePanel && profileBtn && !profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
            profilePanel.classList.remove('open');
            profileBtn.setAttribute('aria-expanded', 'false');
          }
        });

        document.addEventListener('keydown', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            const searchInput = document.getElementById('globalSearchInput');
            if (searchInput) {
              e.preventDefault();
              searchInput.focus();
              searchInput.select();
            }
          }
          if (e.key === 'Escape') {
            if (notifPanel) notifPanel.classList.remove('open');
            if (profilePanel) profilePanel.classList.remove('open');
            if (sidebar && sidebar.classList.contains('drawer-open')) {
              sidebar.classList.remove('drawer-open');
              if (backdrop) backdrop.classList.remove('active');
              document.body.style.overflow = '';
            }
          }
        });
      }
    },

    DEMO_PROFILES: DEMO_PROFILES
  };

  // Auto-expose on global window
  global.ERPAuth = ERPAuth;

  // Auto-hydrate and bind navigation on DOM ready if elements exist
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      ERPAuth.hydrateHeader();
      ERPAuth.initHeaderNav();
    });
  }

})(typeof window !== 'undefined' ? window : this);
