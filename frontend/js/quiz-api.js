/**
 * SSGMCE College ERP — Production Central Quiz API Client
 * Seamless integration with Canonical FastAPI Backend (/api/v1/quizzes, /api/v1/attempts)
 * Zero-trust security, real-time autosave, server-side evaluation, anti-cheat proctoring & analytics.
 */

(function (window) {
  'use strict';

  function getApiBase() {
    var cfg = (typeof window !== 'undefined' && window.ERP_CONFIG) || {};
    if (cfg.API_BASE) return cfg.API_BASE;
    if (cfg.API_BASE_URL) return cfg.API_BASE_URL;
    var port = (window.location && window.location.port) ? window.location.port : '';
    var origin = (port === '8000') 
      ? window.location.origin 
      : 'http://' + (window.location.hostname || 'localhost') + ':8000';
    return origin + '/api/v1';
  }

  function getAuthToken() {
    if (window.ERP_AUTH && typeof window.ERP_AUTH.getToken === 'function') {
      var tok = window.ERP_AUTH.getToken();
      if (tok) return tok;
    }
    return (typeof localStorage !== 'undefined' && (localStorage.getItem('ssgmce_access_token') || localStorage.getItem('ssgmce_token'))) ||
           (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ssgmce_access_token')) ||
           null;
  }

  var QuizAPI = {
    get apiBase() {
      return getApiBase();
    },

    // Standard Authenticated Fetch
    async _fetch(endpoint, options = {}) {
      var base = getApiBase();
      var url = endpoint.startsWith('http') ? endpoint : (base + endpoint);
      var token = getAuthToken();

      var headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      try {
        var res = await fetch(url, {
          ...options,
          headers: headers
        });

        if (!res.ok) {
          var errData = await res.json().catch(function () { return {}; });
          var msg = (errData.error && errData.error.message) || errData.detail || errData.message || ('Server error (' + res.status + ')');
          throw new Error(msg);
        }

        var json = await res.json();
        return json;
      } catch (err) {
        console.warn('[QuizAPI] Request error for ' + endpoint + ':', err.message);
        throw err;
      }
    },

    // 1. Classes List
    async getClasses() {
      try {
        var res = await this._fetch('/admin/classes');
        return res.data || [];
      } catch (e) {
        var res2 = await this._fetch('/classes').catch(function () { return { data: [] }; });
        return res2.data || [];
      }
    },

    // 2. Students List for Class
    async getStudents(className) {
      var query = className ? ('?class_name=' + encodeURIComponent(className)) : '';
      var res = await this._fetch('/students' + query);
      return res.data || [];
    },

    // 3. Teacher Profile
    async getTeacherProfile() {
      try {
        var res = await this._fetch('/teachers/profile');
        return res.data || { full_name: 'Faculty Member', designation: 'Faculty', emp_code: '' };
      } catch (e) {
        return { full_name: 'Faculty Member', designation: 'Faculty', emp_code: '' };
      }
    },

    // 4. Student Profile
    async getStudentProfile(studentIdOrCode) {
      try {
        var query = studentIdOrCode ? ('?student_code=' + encodeURIComponent(studentIdOrCode)) : '';
        var res = await this._fetch('/students/profile' + query);
        return res.data || null;
      } catch (e) {
        return null;
      }
    },

    // 5. Teacher: List All Quizzes
    async getTeacherQuizzes(classId) {
      var query = classId ? ('?class_id=' + encodeURIComponent(classId)) : '';
      var res = await this._fetch('/quizzes' + query);
      return res.data || [];
    },

    // 6. Teacher: Create Quiz with Full Configuration
    async createQuiz(payload) {
      var res = await this._fetch('/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.data;
    },

    // 7. Teacher: Get Quiz Details
    async getQuizDetails(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId));
      return res.data;
    },

    // 8. Teacher: Update Quiz Config
    async updateQuiz(quizId, payload) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return res.data;
    },

    // 9. Teacher: Toggle Publish Status
    async togglePublish(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/publish', {
        method: 'PUT'
      });
      return res.data;
    },

    // 10. Teacher: Close Quiz
    async closeQuiz(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/close', {
        method: 'POST'
      });
      return res.data;
    },

    // 11. Teacher: Delete Quiz
    async deleteQuiz(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId), {
        method: 'DELETE'
      });
      return res.data;
    },

    // 12. Teacher: Get Questions for Quiz
    async getQuizQuestions(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/questions');
      return res.data || [];
    },

    // 13. Teacher: Add Single Question
    async addQuestion(quizId, questionData) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/questions', {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
      return res.data;
    },

    // 14. Teacher: Delete Question
    async deleteQuestion(quizId, questionId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/questions/' + encodeURIComponent(questionId), {
        method: 'DELETE'
      });
      return res.data;
    },

    // 15. Student: Get Available Quizzes for Enrolled Class
    async getStudentQuizzes(className, studentId) {
      var query = '';
      if (className) query += '?class_id=' + encodeURIComponent(className);
      if (studentId) query += (query ? '&' : '?') + 'student_code=' + encodeURIComponent(studentId);
      var res = await this._fetch('/quizzes' + query);
      return res.data || [];
    },

    // 16. Student: Start Quiz Attempt (Server Timers & Sanitized Questions)
    async startQuizAttempt(quizId, studentId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/start', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId })
      });
      return res.data;
    },

    // 17. Student: Autosave Answers in Real-Time
    async saveAttemptAnswers(attemptId, answers) {
      try {
        var res = await this._fetch('/attempts/' + encodeURIComponent(attemptId) + '/answers', {
          method: 'PUT',
          body: JSON.stringify({ answers: answers })
        });
        return res.data;
      } catch (err) {
        console.warn('[QuizAPI] Autosave warning:', err.message);
        return null;
      }
    },

    // 18. Student: Submit Quiz Attempt (Authoritative Server Evaluation)
    async submitQuizAttempt(attemptId, answers, isAutoSubmit = false, reason = null) {
      var res = await this._fetch('/attempts/' + encodeURIComponent(attemptId) + '/submit', {
        method: 'POST',
        body: JSON.stringify({
          answers: answers,
          is_auto_submit: Boolean(isAutoSubmit),
          submission_reason: reason
        })
      });
      return res.data;
    },

    // 19. Student: Get Scorecard & Detailed Breakdown
    async getAttemptResult(attemptId) {
      var res = await this._fetch('/attempts/' + encodeURIComponent(attemptId) + '/result');
      return res.data;
    },

    // 20. Student / Proctoring: Record Security Anomaly Event
    async recordSecurityEvent(attemptId, eventType, metadata = {}) {
      try {
        var res = await this._fetch('/attempts/' + encodeURIComponent(attemptId) + '/security-event', {
          method: 'POST',
          body: JSON.stringify({
            event_type: eventType,
            metadata: metadata
          })
        });
        return res.data;
      } catch (err) {
        console.warn('[QuizAPI] Security event logging warning:', err.message);
        return null;
      }
    },

    // 21. Teacher: Comprehensive Performance Analytics
    async getQuizAnalytics(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/analytics');
      return res.data;
    },

    // 22. Teacher / Student: Class Leaderboard
    async getQuizLeaderboard(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/leaderboard');
      return res.data || [];
    },

    // 23. Teacher: Toggle Release Results to Students
    async toggleReleaseResults(quizId, shouldRelease = null) {
      var payload = shouldRelease !== null ? { release: shouldRelease } : {};
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/toggle-release-results', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.data;
    },

    // 24. Teacher: Direct Export URL (CSV, Excel)
    getExportUrl(quizId, filter = 'all', format = 'csv') {
      return getApiBase() + '/quizzes/' + encodeURIComponent(quizId) + '/export?filter=' + encodeURIComponent(filter) + '&format=' + encodeURIComponent(format);
    },

    // 25. Teacher: Security Events Log
    async getQuizSecurityEvents(quizId) {
      var res = await this._fetch('/quizzes/' + encodeURIComponent(quizId) + '/security-events');
      return res.data || [];
    },

    // 26. Client-Side Anti-Cheating Proctoring Watchdog
    initProctoringWatchdog(attemptId, onAnomalyCallback) {
      if (!attemptId) return null;

      var tabSwitchCount = 0;
      var blurCount = 0;

      function handleVisibilityChange() {
        if (document.hidden) {
          tabSwitchCount++;
          QuizAPI.recordSecurityEvent(attemptId, 'tab_switch', { count: tabSwitchCount, timestamp: new Date().toISOString() });
          if (onAnomalyCallback) onAnomalyCallback('tab_switch', tabSwitchCount);
        }
      }

      function handleWindowBlur() {
        blurCount++;
        QuizAPI.recordSecurityEvent(attemptId, 'window_blur', { count: blurCount, timestamp: new Date().toISOString() });
        if (onAnomalyCallback) onAnomalyCallback('window_blur', blurCount);
      }

      function handleFullscreenChange() {
        if (!document.fullscreenElement) {
          QuizAPI.recordSecurityEvent(attemptId, 'fullscreen_exit', { timestamp: new Date().toISOString() });
          if (onAnomalyCallback) onAnomalyCallback('fullscreen_exit', 1);
        }
      }

      function handleContextMenu(e) {
        e.preventDefault();
        QuizAPI.recordSecurityEvent(attemptId, 'right_click', { timestamp: new Date().toISOString() });
        return false;
      }

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('contextmenu', handleContextMenu);

      return {
        stop: function () {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('blur', handleWindowBlur);
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('contextmenu', handleContextMenu);
        }
      };
    }
  };

  window.QuizAPI = QuizAPI;
})(window);
