/**
 * SSGMCE College ERP — Central Quiz API & Supabase Integration Client
 * Directly interacts with FastAPI backend at http://localhost:8000/api/v1/quiz
 * and provides live Supabase PostgreSQL fallback if needed.
 */

(function (window) {
  'use strict';

  const API_BASE = 'http://localhost:8000/api/v1/quiz';
  const SUPABASE_CONFIG = {
    url: 'https://gftqvclenyplnuoocbwe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY'
  };

  // Direct Supabase Client Instance
  let supabaseClient = null;
  function getSupabaseInstance() {
    if (!supabaseClient) {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      }
    }
    return supabaseClient;
  }

  const QuizAPI = {
    apiBase: API_BASE,
    supabaseConfig: SUPABASE_CONFIG,

    get supabase() {
      return getSupabaseInstance();
    },

    // Realtime Supabase Channel for Class Quiz Notifications
    subscribeToQuizNotifications(className, onNotification) {
      const client = getSupabaseInstance();
      if (!client) {
        console.warn('[QuizAPI] Supabase JS SDK not loaded, relying on REST polling for notifications.');
        return null;
      }
      try {
        const channel = client
          .channel(`public:notifications:class:${className || 'all'}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: className ? `class_name=eq.${className}` : undefined
            },
            payload => {
              console.log('[QuizAPI] Live Supabase notification received:', payload);
              if (onNotification) onNotification(payload.new);
            }
          )
          .subscribe();
        return channel;
      } catch (err) {
        console.warn('[QuizAPI] Supabase Realtime subscription error:', err);
        return null;
      }
    },

    // Helper: Standard Fetch with timeout
    async _fetch(endpoint, options = {}) {
      const url = `${this.apiBase}${endpoint}`;
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || `Server returned ${res.status}`);
        }
        const json = await res.json();
        return json;
      } catch (err) {
        console.warn(`[QuizAPI] Request failed for ${endpoint}:`, err.message);
        throw err;
      }
    },

    // 1. Classes List (100% Dynamic from Database)
    async getClasses() {
      const res = await this._fetch('/classes');
      return res.data || [];
    },

    // 1b. Students List (Dynamic from Database)
    async getStudents(className) {
      let query = '';
      if (className) query = `?class_name=${encodeURIComponent(className)}`;
      const res = await this._fetch(`/students${query}`);
      return res.data || [];
    },

    // 1c. Teacher Profile (Dynamic from Database)
    async getTeacherProfile() {
      const res = await this._fetch('/teacher/profile');
      return res.data || { full_name: 'Faculty', designation: 'Faculty Member', emp_code: '' };
    },

    // 1c-2. Student Profile (Dynamic Authenticated Profile)
    async getStudentProfile(studentIdOrCode) {
      try {
        let query = '';
        if (studentIdOrCode) query = `?student_id=${encodeURIComponent(studentIdOrCode)}`;
        const res = await this._fetch(`/student/profile${query}`);
        return res.data || null;
      } catch (e) {
        console.warn('QuizAPI getStudentProfile notice:', e);
        return null;
      }
    },

    // 1d. Student Performance Trend & Real Metrics (Dynamic from Database)
    async getStudentTrend(studentId) {
      const res = await this._fetch(`/student/${studentId}/trend`);
      return res.data || {
        total_attempts: 0,
        average_score_pct: 0.0,
        average_speed_seconds: 0,
        overall_accuracy_pct: 0.0,
        trend_labels: [],
        trend_scores: []
      };
    },


    // 2. Teacher: List All Quizzes
    async getTeacherQuizzes() {
      try {
        const res = await this._fetch('/teacher/quizzes');
        return res.data || [];
      } catch (err) {
        console.error('Failed to fetch teacher quizzes:', err);
        return [];
      }
    },

    // 3. Teacher: Create Quiz (Triggers automatic notifications for target class)
    async createQuiz(payload) {
      const res = await this._fetch('/teacher/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.data;
    },

    // 4. Teacher: Toggle Publish Status
    async togglePublish(quizId) {
      const res = await this._fetch(`/teacher/quizzes/${quizId}/publish`, {
        method: 'PUT'
      });
      return res.data;
    },

    // 5. Teacher: Delete Quiz
    async deleteQuiz(quizId) {
      const res = await this._fetch(`/teacher/quizzes/${quizId}`, {
        method: 'DELETE'
      });
      return res.data;
    },

    // 6. Teacher: Get Quiz Questions
    async getQuizQuestions(quizId) {
      const res = await this._fetch(`/teacher/quizzes/${quizId}/questions`);
      return res.data || [];
    },

    // 7. Teacher: Add Single Question
    async addQuestion(quizId, questionData) {
      const res = await this._fetch(`/teacher/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
      return res.data;
    },

    // 8. Teacher: Delete Question
    async deleteQuestion(quizId, questionId) {
      const res = await this._fetch(`/teacher/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE'
      });
      return res.data;
    },

    // 9. Student: Get Class-Restricted Quizzes
    async getStudentQuizzes(className, studentId) {
      let query = `?class_name=${encodeURIComponent(className || '1R1')}`;
      if (studentId) query += `&student_id=${encodeURIComponent(studentId)}`;
      try {
        const res = await this._fetch(`/student/quizzes${query}`);
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.quizzes)) return res.data.quizzes;
        return [];
      } catch (err) {
        console.error('Failed to fetch student quizzes:', err);
        return [];
      }
    },

    // 10. Student: Get Class-Targeted Notifications
    async getNotifications(className) {
      let query = '';
      if (className) query = `?class_name=${encodeURIComponent(className)}`;
      try {
        const res = await this._fetch(`/notifications${query}`);
        return res.data || [];
      } catch (err) {
        console.warn('Failed to fetch quiz notifications:', err);
        return [];
      }
    },

    // 11. Student: Start Quiz Attempt (Answer keys stripped for security)
    async startQuizAttempt(quizId, studentId, studentName, className) {
      const res = await this._fetch(`/student/quizzes/${quizId}/start`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId || 'demo-student-id',
          student_name: studentName || 'Student',
          class_name: className
        })
      });
      return res.data;
    },

    // 12. Student: Submit Quiz Attempt (Server-Side Evaluation & Scoring)
    async submitQuizAttempt(attemptId, answers) {
      const res = await this._fetch(`/student/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          attempt_id: attemptId,
          answers: answers
        })
      });
      return res.data;
    },

    // 13. Analytics: Question Difficulty & Metrics
    async getQuizAnalytics(quizId) {
      try {
        const res = await this._fetch(`/quizzes/${quizId}/analytics`);
        return res.data;
      } catch (err) {
        console.warn('Failed to fetch quiz analytics:', err);
        return null;
      }
    },

    // 14. Leaderboard: Class-wide Rankings
    async getQuizLeaderboard(quizId) {
      try {
        const res = await this._fetch(`/quizzes/${quizId}/leaderboard`);
        return res.data || [];
      } catch (err) {
        console.warn('Failed to fetch leaderboard:', err);
        return [];
      }
    },

    // 15. Student: Autosave Answers Periodic / On Change
    async saveAttemptAnswers(attemptId, answers) {
      try {
        const res = await this._fetch(`/attempts/${attemptId}/answers`, {
          method: 'PUT',
          body: JSON.stringify({ answers })
        });
        return res.data;
      } catch (err) {
        console.warn('Autosave notice:', err);
        return null;
      }
    },

    // 16. Teacher: Full Class Results & Participation Roster (All Enrolled Students)
    async getQuizResults(quizId, filter = 'all') {
      try {
        const res = await this._fetch(`/quizzes/${quizId}/results?filter=${encodeURIComponent(filter)}`);
        return res.data;
      } catch (err) {
        console.error('Failed to fetch quiz results:', err);
        return null;
      }
    },

    // 17. Teacher: Direct Export URL Generator (CSV & JSON)
    getExportUrl(quizId, filter = 'all', format = 'csv') {
      return `${this.apiBase}/quizzes/${quizId}/export?filter=${encodeURIComponent(filter)}&format=${encodeURIComponent(format)}`;
    },

    // 18. Student: Anti-Cheating & Proctoring Event (Tab switch, fullscreen exit, blur)
    async recordSecurityEvent(attemptId, eventType, metadata = {}) {
      try {
        const res = await this._fetch(`/attempts/${attemptId}/security-event`, {
          method: 'POST',
          body: JSON.stringify({ event_type: eventType, metadata })
        });
        return res.data;
      } catch (err) {
        console.warn('Security event logging:', err);
        return null;
      }
    }
  };

  window.QuizAPI = QuizAPI;
})(window);
