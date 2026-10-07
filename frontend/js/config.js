/**
 * SSGMCE College ERP — Centralized Configuration
 * Sets up global API base URLs, Supabase configurations, and storage keys.
 */
(function (window) {
  'use strict';

  // Backend runs on port 8000
  var BACKEND_PORT = 8000;
  var isHttp = window.location && window.location.protocol && window.location.protocol.startsWith('http');
  var currentHost = (window.location && window.location.hostname && window.location.hostname !== '') 
    ? window.location.hostname 
    : '127.0.0.1';
  var currentPort = (window.location && window.location.port) ? window.location.port : '';

  // If the web page is hosted directly on port 8000 (FastAPI serving static files), use current origin.
  // Otherwise (e.g. VS Code Live Server on 5500, file://, or another frontend server),
  // route API requests directly to the FastAPI backend on port 8000.
  var origin = (currentPort === String(BACKEND_PORT))
    ? window.location.origin 
    : ((isHttp ? window.location.protocol : 'http:') + '//' + currentHost + ':' + BACKEND_PORT);

  var Config = {
    // API Endpoints
    API_BASE: window.__API_BASE__ || (origin + '/api/v1'),
    BACKEND_PORT: BACKEND_PORT,
    BACKEND_ORIGIN: origin,
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
