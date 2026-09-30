/**
 * College ERP - Supabase Client Initializer
 * Single Shared Cloud PostgreSQL Database: gftqvclenyplnuoocbwe
 */

const SUPABASE_CONFIG = {
  url: "https://gftqvclenyplnuoocbwe.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY"
};

let supabaseClient = null;

if (typeof window !== "undefined") {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.log("%c[Supabase] Client initialized successfully for College ERP.", "color: #10B981; font-weight: bold; font-size: 13px;");
    } catch (err) {
      console.warn("[Supabase] Failed to initialize Supabase client:", err);
    }
  } else {
    console.info("[Supabase] @supabase/supabase-js library loaded via CDN.");
  }

  window.supabaseClient = supabaseClient;
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SUPABASE_CONFIG, supabaseClient };
}

