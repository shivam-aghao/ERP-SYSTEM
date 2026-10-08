/**
 * SSGMCE College ERP - Supabase Client Initializer
 * Provides window.supabaseClient & window.getSupabaseClient() for Realtime Subscriptions
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = (global.__SUPABASE_URL__) || 'https://gftqvclenyplnuoocbwe.supabase.co';
  var SUPABASE_ANON_KEY = (global.__SUPABASE_ANON_KEY__) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY';

  var clientPromise = null;

  function createClientInstance() {
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      try {
        global.supabaseClient = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        console.info('[supabaseClient] Initialized window.supabaseClient successfully.');
        return global.supabaseClient;
      } catch (err) {
        console.warn('[supabaseClient] createClient error:', err);
      }
    }
    return null;
  }

  function getSupabaseClient() {
    if (global.supabaseClient) {
      return Promise.resolve(global.supabaseClient);
    }

    if (clientPromise) return clientPromise;

    clientPromise = new Promise(function (resolve) {
      var instance = createClientInstance();
      if (instance) {
        resolve(instance);
        return;
      }

      // Dynamically load supabase-js CDN if not yet present in DOM
      if (typeof document !== 'undefined') {
        var existingScript = document.querySelector('script[src*="supabase-js"]');
        if (!existingScript) {
          var script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          script.async = true;
          script.onload = function () {
            resolve(createClientInstance());
          };
          script.onerror = function () {
            console.warn('[supabaseClient] Failed to load Supabase JS CDN');
            resolve(null);
          };
          document.head.appendChild(script);
        } else {
          existingScript.addEventListener('load', function () {
            resolve(createClientInstance());
          });
        }
      } else {
        resolve(null);
      }
    });

    return clientPromise;
  }

  global.getSupabaseClient = getSupabaseClient;

  // Attempt immediate initialization
  createClientInstance();

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', createClientInstance);
    window.addEventListener('load', createClientInstance);
  }
})(typeof window !== 'undefined' ? window : this);
