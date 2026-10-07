/**
 * SSGMCE College ERP — Centralized Configuration
 * Sets up global API base URLs, Supabase configurations, and storage keys.
 */
(function (window) {
  'use strict';

  // Determine current host or fallback to 8000
  var origin = (window.location && window.location.origin && window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://localhost:8000';

  var Config = {
    // API Endpoints
    API_BASE: window.__API_BASE__ || (origin + '/api/v1'),
    BACKEND_PORT: 8000,
    STUDENT_API_BASE: origin + '/api/v1/student',
    TEACHER_API_BASE: 'http://localhost:5001/api/v1',
    QUIZ_API_BASE: origin + '/api/v1/quiz',
    AUTH_API_BASE: origin + '/api/v1/auth',
    ADMIN_API_BASE: origin + '/api/v1',

    // Supabase Configuration
    SUPABASE_URL: 'https://gftqvclenyplnuoocbwe.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY',

    // Storage Keys
    AUTH_STORAGE_KEY: 'ssgmce_user',
    TEACHER_TOKEN_KEY: 'ssgmce_teacher_token',
    ACTIVE_ROLE_KEY: 'ssgmce_active_role'
  };

  // Expose to window
  window.ERP_CONFIG = Config;
  window.__API_BASE__ = Config.API_BASE;
  window.__TEACHER_API_BASE__ = Config.TEACHER_API_BASE;
  window.__STUDENT_API_BASE__ = Config.STUDENT_API_BASE;

})(typeof window !== 'undefined' ? window : this);
