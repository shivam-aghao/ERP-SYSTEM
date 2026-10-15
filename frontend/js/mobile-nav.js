/**
 * ==============================================================================
 * SSGMCE College ERP — Professional Role-Based Mobile Bottom Navigation
 * ==============================================================================
 * Displays a 5-tab fixed navigation bar on mobile screens (viewport <= 768px):
 * 1. Home
 * 2. Timetable
 * 3. Profile (centered per UI design specification)
 * 4. Syllabus
 * 5. Attendance
 *
 * Dynamically resolves routes and view transitions based on the authenticated role:
 * - Student
 * - Teacher / Faculty
 * - Admin
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  var SVG_ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    timetable: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    profile: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    syllabus: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    attendance: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
  };

  function getActiveRole() {
    // 1. Check ERP_AUTH instance if available
    if (window.ERP_AUTH && typeof window.ERP_AUTH.getRole === 'function') {
      try {
        var r = window.ERP_AUTH.getRole();
        if (r) {
          r = String(r).toLowerCase().trim();
          if (r === 'faculty' || r === 'employee' || r === 'hod') return 'teacher';
          if (r === 'super_admin') return 'admin';
          if (r === 'admin' || r === 'student' || r === 'teacher') return r;
        }
      } catch (e) {}
    }

    // 2. Check storage for session / user record
    try {
      var rawUser = localStorage.getItem('ssgmce_user') ||
                    localStorage.getItem('ssgmce_erp_session') ||
                    localStorage.getItem('ssgmce_user_session') ||
                    sessionStorage.getItem('ssgmce_user') ||
                    sessionStorage.getItem('ssgmce_erp_session');
      if (rawUser) {
        var u = JSON.parse(rawUser);
        if (u && u.role) {
          var ur = String(u.role).toLowerCase().trim();
          if (ur === 'faculty' || ur === 'employee' || ur === 'hod') return 'teacher';
          if (ur === 'super_admin') return 'admin';
          if (ur === 'admin' || ur === 'student' || ur === 'teacher') return ur;
        }
      }

      var storedRole = localStorage.getItem('ssgmce_active_role') ||
                       localStorage.getItem('user_role') ||
                       sessionStorage.getItem('user_role');
      if (storedRole) {
        var sr = String(storedRole).toLowerCase().trim();
        if (sr === 'faculty' || sr === 'employee' || sr === 'hod') return 'teacher';
        if (sr === 'super_admin') return 'admin';
        if (sr === 'admin' || sr === 'student' || sr === 'teacher') return sr;
      }
    } catch (e) {}

    // 3. Contextual fallback based on current page URL
    var path = (window.location.pathname || '').toLowerCase();
    if (path.indexOf('teacher') !== -1) return 'teacher';
    if (path.indexOf('admin') !== -1) return 'admin';
    return 'student';
  }

  function getRoleTabs(role) {
    if (role === 'teacher') {
      return [
        { id: 'home', label: 'Home', url: 'teacher-dashboard.html', action: 'teacher-home' },
        { id: 'timetable', label: 'Timetable', url: 'teacher-timetable.html', action: 'teacher-timetable' },
        { id: 'profile', label: 'Profile', url: 'teacher-dashboard.html#profile', action: 'teacher-profile' },
        { id: 'syllabus', label: 'Syllabus', url: 'teacher-dashboard.html#syllabus', action: 'teacher-syllabus' },
        { id: 'attendance', label: 'Attendance', url: 'teacher-attendance.html', action: 'teacher-attendance' }
      ];
    }

    if (role === 'admin') {
      return [
        { id: 'home', label: 'Home', url: 'admin-dashboard.html#tab-overview', action: 'admin-overview' },
        { id: 'timetable', label: 'Timetable', url: 'admin-dashboard.html#tab-classes', action: 'admin-classes' },
        { id: 'profile', label: 'Profile', url: 'admin-dashboard.html#tab-overview', action: 'admin-overview' },
        { id: 'syllabus', label: 'Syllabus', url: 'admin-dashboard.html#tab-classes', action: 'admin-classes' },
        { id: 'attendance', label: 'Attendance', url: 'admin-dashboard.html#tab-attendance', action: 'admin-attendance' }
      ];
    }

    // Default: Student (Profile in the middle: Home, Timetable, Profile, Syllabus, Attendance)
    return [
      { id: 'home', label: 'Home', url: 'student-dashboard.html' },
      { id: 'timetable', label: 'Timetable', url: 'student-timetable.html' },
      { id: 'profile', label: 'Profile', url: 'student-profile.html' },
      { id: 'syllabus', label: 'Syllabus', url: 'student-syllabus.html' },
      { id: 'attendance', label: 'Attendance', url: 'student-attendance.html' }
    ];
  }

  function detectActiveTab(role) {
    var path = (window.location.pathname || '').toLowerCase();
    var hash = (window.location.hash || '').toLowerCase();

    if (role === 'teacher') {
      if (path.indexOf('teacher-timetable') !== -1 || path.indexOf('teacher_timetable') !== -1 || path.indexOf('teacher-test-schedule') !== -1 || path.indexOf('teacher_test_schedule') !== -1) {
        return 'timetable';
      }
      if (path.indexOf('teacher-attendance') !== -1) {
        return 'attendance';
      }
      if (path.indexOf('teacher-dashboard') !== -1 || path.indexOf('teacher_dashboard') !== -1) {
        if (hash.indexOf('syllabus') !== -1 || (window.TeacherApp && window.TeacherApp.currentView === 'syllabus')) {
          return 'syllabus';
        }
        if (hash.indexOf('profile') !== -1 || hash.indexOf('information') !== -1 || (window.TeacherApp && (window.TeacherApp.currentView === 'profile' || window.TeacherApp.currentView === 'information'))) {
          return 'profile';
        }
        if (hash.indexOf('timetable') !== -1 || (window.TeacherApp && window.TeacherApp.currentView === 'timetable')) {
          return 'timetable';
        }
        if (hash.indexOf('attendance') !== -1 || (window.TeacherApp && window.TeacherApp.currentView === 'attendance')) {
          return 'attendance';
        }
        return 'home';
      }
    }

    if (role === 'admin') {
      if (path.indexOf('admin-dashboard') !== -1) {
        if (hash.indexOf('attendance') !== -1 || (window.AdminController && window.AdminController.activeTab === 'tab-attendance')) {
          return 'attendance';
        }
        if (hash.indexOf('classes') !== -1 || (window.AdminController && window.AdminController.activeTab === 'tab-classes')) {
          return 'syllabus';
        }
        return 'home';
      }
    }

    // Student Role
    if (path.indexOf('student-timetable') !== -1 || path.indexOf('student_timetable') !== -1) {
      return 'timetable';
    }
    if (path.indexOf('student-syllabus') !== -1) {
      return 'syllabus';
    }
    if (path.indexOf('student-attendance') !== -1) {
      return 'attendance';
    }
    if (path.indexOf('student-profile') !== -1) {
      return 'profile';
    }
    if (path.indexOf('student-dashboard') !== -1) {
      if (hash.indexOf('profile') !== -1) return 'profile';
      if (hash.indexOf('timetable') !== -1) return 'timetable';
      if (hash.indexOf('syllabus') !== -1) return 'syllabus';
      if (hash.indexOf('attendance') !== -1) return 'attendance';
      return 'home';
    }

    return 'home';
  }

  function handleTabClick(tabDef, role, e) {
    if (e) e.preventDefault();

    var currentPath = (window.location.pathname || '').toLowerCase();

    // 1. Teacher SPA transitions within teacher-dashboard.html
    if (role === 'teacher' && (currentPath.indexOf('teacher-dashboard') !== -1 || currentPath.indexOf('teacher_dashboard') !== -1)) {
      if (tabDef.id === 'home') {
        if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
          window.TeacherApp.switchView('dashboard');
          try { history.replaceState(null, '', 'teacher-dashboard.html'); } catch (err) {}
          updateActiveTabUI('home');
          return;
        }
      } else if (tabDef.id === 'syllabus') {
        if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
          window.TeacherApp.switchView('syllabus');
          window.location.hash = 'syllabus';
          updateActiveTabUI('syllabus');
          return;
        }
      } else if (tabDef.id === 'profile') {
        if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
          window.TeacherApp.switchView('profile');
          window.location.hash = 'profile';
          updateActiveTabUI('profile');
          return;
        }
      }
    }

    // 2. Admin SPA transitions within admin-dashboard.html
    if (role === 'admin' && currentPath.indexOf('admin-dashboard') !== -1) {
      if (window.AdminController && typeof window.AdminController.switchTab === 'function') {
        if (tabDef.id === 'home' || tabDef.id === 'profile') {
          window.AdminController.switchTab('tab-overview');
          window.location.hash = 'tab-overview';
          updateActiveTabUI(tabDef.id);
          return;
        }
        if (tabDef.id === 'timetable' || tabDef.id === 'syllabus') {
          window.AdminController.switchTab('tab-classes');
          window.location.hash = 'tab-classes';
          updateActiveTabUI(tabDef.id);
          return;
        }
        if (tabDef.id === 'attendance') {
          window.AdminController.switchTab('tab-attendance');
          window.location.hash = 'tab-attendance';
          updateActiveTabUI('attendance');
          return;
        }
      }
    }

    // 3. Same-page click on Student Dashboard
    if (tabDef.id === 'home' && currentPath.indexOf('student-dashboard') !== -1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      updateActiveTabUI('home');
      return;
    }

    // 4. Otherwise navigate to target URL
    window.location.href = tabDef.url;
  }

  function updateActiveTabUI(activeTabId) {
    var nav = document.getElementById('erpMobileBottomNav');
    if (!nav) return;
    var items = nav.querySelectorAll('.erp-mob-nav-item');
    items.forEach(function (item) {
      if (item.getAttribute('data-tab') === activeTabId) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  }

  function hookTeacherApp() {
    if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
      if (!window.TeacherApp.__mobileNavHooked) {
        window.TeacherApp.__mobileNavHooked = true;
        var origSwitchView = window.TeacherApp.switchView.bind(window.TeacherApp);
        window.TeacherApp.switchView = function (viewName, subView, preserveFrame) {
          var res = origSwitchView(viewName, subView, preserveFrame);
          var activeId = 'home';
          if (viewName === 'syllabus') activeId = 'syllabus';
          else if (viewName === 'profile' || viewName === 'information') activeId = 'profile';
          else if (viewName === 'timetable') activeId = 'timetable';
          else if (viewName === 'attendance') activeId = 'attendance';
          else if (viewName === 'dashboard') activeId = 'home';
          updateActiveTabUI(activeId);
          return res;
        };
      }
    }
  }

  function renderMobileBottomNav() {
    // Avoid duplicate insertions
    var existingNav = document.getElementById('erpMobileBottomNav');
    var role = getActiveRole();
    var tabs = getRoleTabs(role);
    var activeTab = detectActiveTab(role);

    hookTeacherApp();

    if (existingNav) {
      updateActiveTabUI(activeTab);
      return existingNav;
    }

    var navEl = document.createElement('nav');
    navEl.className = 'erp-mobile-bottom-nav';
    navEl.id = 'erpMobileBottomNav';
    navEl.setAttribute('aria-label', 'Mobile Navigation Bar');

    tabs.forEach(function (tab) {
      var a = document.createElement('a');
      a.className = 'erp-mob-nav-item' + (tab.id === activeTab ? ' active' : '');
      a.href = tab.url;
      a.setAttribute('data-tab', tab.id);
      a.setAttribute('aria-label', tab.label);
      if (tab.id === activeTab) {
        a.setAttribute('aria-current', 'page');
      }

      var iconWrap = document.createElement('div');
      iconWrap.className = 'erp-mob-icon-wrap';
      iconWrap.innerHTML = SVG_ICONS[tab.id] || '';

      var labelSpan = document.createElement('span');
      labelSpan.className = 'erp-mob-label';
      labelSpan.textContent = tab.label;

      a.appendChild(iconWrap);
      a.appendChild(labelSpan);

      a.addEventListener('click', function (e) {
        handleTabClick(tab, role, e);
      });

      navEl.appendChild(a);
    });

    document.body.appendChild(navEl);
    document.body.classList.add('has-erp-mobile-nav');

    // Keep active tab state synchronized on hashchange / popstate
    window.addEventListener('hashchange', function () {
      var currentRole = getActiveRole();
      updateActiveTabUI(detectActiveTab(currentRole));
      hookTeacherApp();
    });

    window.addEventListener('popstate', function () {
      var currentRole = getActiveRole();
      updateActiveTabUI(detectActiveTab(currentRole));
      hookTeacherApp();
    });

    // Handle initial hash routing for Teacher SPA
    if (window.location.hash) {
      var h = window.location.hash.toLowerCase();
      if (h.indexOf('syllabus') !== -1) {
        if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
          window.TeacherApp.switchView('syllabus');
        }
        updateActiveTabUI('syllabus');
      } else if (h.indexOf('profile') !== -1) {
        if (window.TeacherApp && typeof window.TeacherApp.switchView === 'function') {
          window.TeacherApp.switchView('profile');
        }
        updateActiveTabUI('profile');
      }
    }

    return navEl;
  }

  // Initialize as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderMobileBottomNav);
  } else {
    renderMobileBottomNav();
  }

  // Export API for programmatic access
  window.ERPMobileNav = {
    render: renderMobileBottomNav,
    getRole: getActiveRole,
    updateActive: updateActiveTabUI
  };

})(window, document);

