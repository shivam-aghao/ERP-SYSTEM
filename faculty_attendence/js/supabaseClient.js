/**
 * @file supabaseClient.js
 * @description Supabase client initialization, authentication handling, and Realtime sync helpers
 * for SSGMCE Teacher Attendance ERP Portal.
 */

(function (window) {
  // Default configuration
  // Replace these with your Supabase Project URL and anon key from Supabase Dashboard -> Project Settings -> API
  const DEFAULT_CONFIG = {
    url: "https://szymhbmrupktrboduvlw.supabase.co/rest/v1/" ,
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eW1oYm1ydXBrdHJib2R1dmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMDc3NTgsImV4cCI6MjEwNTg4Mzc1OH0.DtMxNfnnUmhyP_GGUK4Fms5e7nPHobUPwNVpo1cpP_M"
  };

  const envUrl = (window.__ENV__ && window.__ENV__.SUPABASE_URL) || localStorage.getItem("SUPABASE_URL") || DEFAULT_CONFIG.url;
  const envKey = (window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || localStorage.getItem("SUPABASE_ANON_KEY") || DEFAULT_CONFIG.anonKey;

  const isConfigured = Boolean(
    envUrl &&
    envKey &&
    !envUrl.includes("your-project-id") &&
    !envKey.includes("your-anon-key")
  );

  let supabase = null;

  if (isConfigured && window.supabase && typeof window.supabase.createClient === "function") {
    try {
      supabase = window.supabase.createClient(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log("[SupabaseClient] Successfully initialized Supabase v2 client connected to:", envUrl);
    } catch (err) {
      console.error("[SupabaseClient] Initialization failed:", err);
    }
  } else if (!isConfigured) {
    console.info(
      "[SupabaseClient] Supabase credentials not set or using placeholders. Using mock/local fallback. " +
      "Set your keys in js/supabaseClient.js, .env, or localStorage."
    );
  }

  /**
   * @typedef {Object} TeacherProfile
   * @property {string} id - UUID matching auth.users.id
   * @property {string} full_name - Teacher full name
   * @property {string} emp_code - Teacher employee code (e.g. EMP-CSE-1042)
   * @property {string} designation - Designation (e.g. Associate Professor)
   * @property {string} department_id - Department UUID
   * @property {string} [department_name] - Department name
   * @property {string} [department_code] - Department code (e.g. CSE)
   */

  const SupabaseClient = {
    client: supabase,
    isConfigured: isConfigured,

    /**
     * Set credentials at runtime and reinitialize client
     * @param {string} url - Supabase Project URL
     * @param {string} anonKey - Supabase anon/public key
     * @returns {boolean} True if initialized successfully
     */
    configure(url, anonKey) {
      if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error("[SupabaseClient] @supabase/supabase-js library is not loaded.");
        return false;
      }
      try {
        this.client = window.supabase.createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        localStorage.setItem("SUPABASE_URL", url);
        localStorage.setItem("SUPABASE_ANON_KEY", anonKey);
        this.isConfigured = true;
        console.log("[SupabaseClient] Reconfigured client with URL:", url);
        return true;
      } catch (e) {
        console.error("[SupabaseClient] Failed to reconfigure:", e);
        return false;
      }
    },

    /**
     * Check if active authenticated session exists
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
      if (!this.client) return false;
      try {
        const { data: { session } } = await this.client.auth.getSession();
        return Boolean(session && session.user);
      } catch (e) {
        return false;
      }
    },

    /**
     * Sign in teacher with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{ user: Object, session: Object }>}
     */
    async signIn(email, password) {
      if (!this.client) {
        throw new Error("Supabase is not configured. Please supply SUPABASE_URL and SUPABASE_ANON_KEY.");
      }
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      // Verify that the authenticated user has a registered row in `teachers`
      const teacher = await this.getCurrentTeacher();
      if (!teacher) {
        await this.signOut();
        throw new Error("Access blocked: Not a registered teacher in the SSGMCE database.");
      }
      return data;
    },

    /**
     * Sign out teacher session
     * @returns {Promise<void>}
     */
    async signOut() {
      if (!this.client) return;
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.error("[SupabaseClient] SignOut error:", e);
      }
    },

    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
      if (!this.client) return null;
      try {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
      } catch (e) {
        return null;
      }
    },

    /**
     * Get current teacher profile joined with department
     * @returns {Promise<TeacherProfile|null>}
     */
    async getCurrentTeacher() {
      if (!this.client) return null;
      try {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const { data, error } = await this.client
          .from("teachers")
          .select("id, full_name, emp_code, designation, department_id, departments(code, name)")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !data) return null;

        return {
          id: data.id,
          full_name: data.full_name,
          emp_code: data.emp_code,
          designation: data.designation,
          department_id: data.department_id,
          department_code: data.departments?.code || "CSE",
          department_name: data.departments?.name || "Computer Science & Engineering"
        };
      } catch (e) {
        console.error("[SupabaseClient] getCurrentTeacher error:", e);
        return null;
      }
    },

    /**
     * Listen for auth changes
     * @param {function(string, Object|null): void} callback
     */
    onAuthStateChange(callback) {
      if (!this.client) return { unsubscribe: () => {} };
      const { data: { subscription } } = this.client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return subscription;
    },

    /**
     * Realtime subscription for attendance sessions and records
     * @param {string} teacherId - Teacher UUID
     * @param {function(Object): void} onRecordChange - Callback for attendance_records events
     * @param {function(Object): void} onSessionChange - Callback for attendance_sessions events
     * @returns {Object} Realtime channel
     */
    subscribeToAttendance(teacherId, onRecordChange, onSessionChange) {
      if (!this.client) return null;

      const channelName = `realtime-attendance-${teacherId || "global"}`;
      const channel = this.client
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance_records"
          },
          (payload) => {
            console.log("[Realtime] attendance_record changed:", payload);
            if (typeof onRecordChange === "function") {
              onRecordChange(payload);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance_sessions"
          },
          (payload) => {
            console.log("[Realtime] attendance_session changed:", payload);
            if (typeof onSessionChange === "function") {
              onSessionChange(payload);
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] Attendance subscription status: ${status}`);
        });

      return channel;
    },

    /**
     * Realtime subscription for teacher notifications
     * @param {string} teacherId - Teacher UUID
     * @param {function(Object): void} onNotification - Callback when notification arrives
     * @returns {Object} Realtime channel
     */
    subscribeToNotifications(teacherId, onNotification) {
      if (!this.client || !teacherId) return null;

      const channelName = `realtime-notif-${teacherId}`;
      const channel = this.client
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `teacher_id=eq.${teacherId}`
          },
          (payload) => {
            console.log("[Realtime] New notification:", payload);
            if (typeof onNotification === "function") {
              onNotification(payload.new);
            }
          }
        )
        .subscribe();

      return channel;
    }
  };

  window.SupabaseClient = SupabaseClient;
})(window);
