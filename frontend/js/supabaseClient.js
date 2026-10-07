/**
 * SSGMCE College ERP - Supabase Client Initializer
 * Provides window.supabaseClient for teacher & attendance modules
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = (global.__SUPABASE_URL__) || 'https://gftqvclenyplnuoocbwe.supabase.co';
  var SUPABASE_ANON_KEY = (global.__SUPABASE_ANON_KEY__) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY';

  function initSupabase() {
    if (global.supabase && typeof global.supabase.createClient === 'function' && !global.supabaseClient) {
      try {
        global.supabaseClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.info('[supabaseClient] Initialized window.supabaseClient successfully.');
      } catch (err) {
        console.warn('[supabaseClient] Initialization note:', err);
      }
    }
  }

  // Attempt immediate initialization
  initSupabase();

  // Also listen for DOMContentLoaded or load event if library was loaded async/defer
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initSupabase);
    window.addEventListener('load', initSupabase);
  }
})(typeof window !== 'undefined' ? window : this);

