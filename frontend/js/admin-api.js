/**
 * SSGMCE College ERP — Admin Portal API Client
 */
(function (window) {
  'use strict';

  var API_BASE = (window.ERP_CONFIG && window.ERP_CONFIG.ADMIN_API_BASE) || 'http://localhost:8000/api/v1';

  var AdminApi = {
    async getStats() {
      const res = await fetch(`${API_BASE}/admin/stats`);
      return await res.json();
    },

    async getDepartments() {
      const res = await fetch(`${API_BASE}/departments`);
      return await res.json();
    },

    async getClasses() {
      const res = await fetch(`${API_BASE}/classes`);
      return await res.json();
    },

    async getSubjects() {
      const res = await fetch(`${API_BASE}/subjects`);
      return await res.json();
    },

    async getStudents(classId = null) {
      let url = `${API_BASE}/students`;
      if (classId) url += `?class_id=${encodeURIComponent(classId)}`;
      const res = await fetch(url);
      return await res.json();
    }
  };

  window.AdminApi = AdminApi;
})(typeof window !== 'undefined' ? window : this);
