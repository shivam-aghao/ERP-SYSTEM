/**
 * SSGMCE College ERP — Isolated Student-Side Quiz Security Module
 * Applies strictly during an active student quiz attempt inside #view-runner.
 * Preserves all existing teacher, admin, and non-quiz student ERP functionality.
 */
(function (window, document) {
  'use strict';

  var DEDUP_WINDOW_MS = 2500; // Prevents double-counting when blur + visibilitychange fire together
  var INITIAL_GRACE_MS = 1800; // Grace period right after starting attempt / requesting fullscreen

  var state = {
    isActive: false,
    isSubmitting: false,
    attemptId: null,
    quizId: null,
    studentName: 'Student',
    studentCode: '',
    rollNo: '',
    className: '',
    maxViolations: 5,
    autoSubmitOnMaxViolations: false,
    violationCount: 0,
    tabSwitchCount: 0,
    blurCount: 0,
    fullscreenExitCount: 0,
    copyAttemptCount: 0,
    lastIncidentAt: 0,
    startedAtMs: 0,
    wasFullscreenEntered: false,
    fullscreenSupported: false,
    watermarkInterval: null,
    onAutoSubmitCallback: null
  };

  function isRunnerVisible() {
    var runner = document.getElementById('view-runner');
    return Boolean(state.isActive && !state.isSubmitting && runner && runner.classList.contains('active'));
  }

  function isInsideRunner(target) {
    if (!target || !target.closest) return false;
    return Boolean(target.closest('#view-runner'));
  }

  function isFullscreenActive() {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function checkFullscreenSupport() {
    var el = document.documentElement;
    return Boolean(
      el && (
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen
      )
    );
  }

  async function requestExamFullscreen() {
    var el = document.documentElement;
    if (!el || !checkFullscreenSupport()) {
      state.fullscreenSupported = false;
      updateSecurityStatusBar();
      return false;
    }
    state.fullscreenSupported = true;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      state.wasFullscreenEntered = true;
      updateSecurityStatusBar();
      return true;
    } catch (err) {
      // Do NOT penalize or auto-submit if browser/mobile OS declines fullscreen
      updateSecurityStatusBar();
      return false;
    }
  }

  function exitExamFullscreen() {
    try {
      if (isFullscreenActive()) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(function () {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (e) {}
  }

  function logBackendSecurityEvent(eventType, details) {
    if (!state.attemptId || !window.QuizAPI || typeof window.QuizAPI.recordSecurityEvent !== 'function') {
      return;
    }
    var safeMeta = {
      violation_count: state.violationCount,
      tab_switches: state.tabSwitchCount,
      window_blurs: state.blurCount,
      fullscreen_exits: state.fullscreenExitCount,
      copy_attempts: state.copyAttemptCount,
      is_mobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ''),
      timestamp: new Date().toISOString()
    };
    if (details && typeof details === 'object') {
      Object.keys(details).forEach(function (k) {
        if (!/token|password|secret|auth|key/i.test(k)) {
          safeMeta[k] = details[k];
        }
      });
    }
    window.QuizAPI.recordSecurityEvent(state.attemptId, eventType, safeMeta);
  }

  // ---------------------------------------------------------------------------
  // 1. Dynamic Student Watermark & UI Injection inside #view-runner
  // ---------------------------------------------------------------------------
  function ensureSecurityUIMounted() {
    var runner = document.getElementById('view-runner');
    if (!runner) return;

    runner.classList.add('quiz-secure-active');

    // A. Security Status Strip above question area
    var statusStrip = document.getElementById('quizSecurityStatusBar');
    if (!statusStrip) {
      statusStrip = document.createElement('div');
      statusStrip.id = 'quizSecurityStatusBar';
      statusStrip.className = 'quiz-security-statusbar';
      var runnerHeader = runner.querySelector('.quiz-runner-header');
      if (runnerHeader && runnerHeader.nextSibling) {
        runner.insertBefore(statusStrip, runnerHeader.nextSibling);
      } else {
        runner.insertBefore(statusStrip, runner.firstChild);
      }
    }

    // B. Non-intrusive Watermark Overlay inside .question-card
    var qCard = runner.querySelector('.question-card');
    if (qCard) {
      qCard.style.position = 'relative';
      qCard.style.overflow = 'hidden';
      var wm = document.getElementById('quizStudentWatermark');
      if (!wm) {
        wm = document.createElement('div');
        wm.id = 'quizStudentWatermark';
        wm.className = 'quiz-watermark-overlay';
        wm.setAttribute('aria-hidden', 'true');
        qCard.appendChild(wm);
      }
    }

    // C. Violation Warning Modal (inside #view-runner)
    var warnModal = document.getElementById('quizSecurityWarningModal');
    if (!warnModal) {
      warnModal = document.createElement('div');
      warnModal.id = 'quizSecurityWarningModal';
      warnModal.className = 'quiz-modal-backdrop';
      warnModal.setAttribute('role', 'alertdialog');
      warnModal.setAttribute('aria-modal', 'true');
      warnModal.innerHTML =
        '<div class="quiz-modal-box" style="max-width: 480px; border-top: 4px solid #EF4444;">' +
          '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.85rem;">' +
            '<div style="width:42px; height:42px; border-radius:50%; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;">⚠️</div>' +
            '<div>' +
              '<h3 id="quizSecWarnTitle" style="margin:0; color:#0B1F3A; font-size:1.1rem;">Active Quiz Security Warning</h3>' +
              '<p id="quizSecWarnCountBadge" style="margin:0.15rem 0 0 0; font-size:0.78rem; font-weight:700; color:#DC2626;">Warning 1</p>' +
            '</div>' +
          '</div>' +
          '<p id="quizSecWarnMessage" style="font-size:0.88rem; color:#334155; line-height:1.5; margin-bottom:1rem; background:#FEF2F2; border:1px solid #FECACA; padding:0.75rem 0.9rem; border-radius:8px;"></p>' +
          '<div style="font-size:0.78rem; color:#64748B; margin-bottom:1.25rem;">' +
            'Please remain on this quiz screen until you submit your answers. Your timer and saved answers are preserved.' +
          '</div>' +
          '<div style="display:flex; justify-content:flex-end; gap:0.65rem; flex-wrap:wrap;">' +
            '<button type="button" id="quizSecReenterFsBtn" class="btn btn-secondary" style="display:none; font-size:0.82rem;">Re-Enter Full Screen</button>' +
            '<button type="button" id="quizSecAckBtn" class="btn btn-primary" style="font-size:0.85rem;">I Understand — Resume Quiz</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(warnModal);

      var styleEl = document.getElementById('quizSecModalStyles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'quizSecModalStyles';
        styleEl.textContent = '@keyframes quizSecSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(styleEl);
      }

      var ackBtn = document.getElementById('quizSecAckBtn');
      if (ackBtn) {
        ackBtn.addEventListener('click', function () {
          if (state.isSubmitting || state.violationCount >= (state.maxViolations || 5)) return;
          warnModal.classList.remove('active');
          setBlurCurtain(false);
        });
      }
      var fsBtn = document.getElementById('quizSecReenterFsBtn');
      if (fsBtn) {
        fsBtn.addEventListener('click', function () {
          if (state.isSubmitting || state.violationCount >= (state.maxViolations || 5)) return;
          requestExamFullscreen();
          warnModal.classList.remove('active');
          setBlurCurtain(false);
        });
      }
    }

    renderWatermarkTiles();
    updateSecurityStatusBar();
  }

  function renderWatermarkTiles() {
    var wm = document.getElementById('quizStudentWatermark');
    if (!wm) return;
    var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var rollLabel = state.rollNo ? ('Roll ' + state.rollNo) : (state.studentCode || 'Verified');
    var shortAttempt = state.attemptId ? String(state.attemptId).slice(0, 8) : 'EXAM';
    var stampText = [state.studentName, rollLabel, state.className, '#' + shortAttempt, timeStr]
      .filter(Boolean)
      .join(' • ');

    var tilesHtml = '';
    for (var i = 0; i < 12; i++) {
      tilesHtml += '<span class="quiz-watermark-stamp">' + escapeHtml(stampText) + '</span>';
    }
    wm.innerHTML = tilesHtml;
  }

  function updateSecurityStatusBar() {
    var strip = document.getElementById('quizSecurityStatusBar');
    if (!strip) return;

    var fsActive = isFullscreenActive();
    var fsSupported = checkFullscreenSupport();
    var rollLabel = state.rollNo ? ('Roll: ' + state.rollNo) : (state.studentCode ? ('ID: ' + state.studentCode) : '');
    var studentBadge = escapeHtml(state.studentName) + (rollLabel ? (' (' + escapeHtml(rollLabel) + ')') : '');
    var maxV = (state.maxViolations > 0) ? state.maxViolations : 5;

    var violationColor = state.violationCount === 0
      ? 'background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;'
      : (state.violationCount >= maxV
          ? 'background:#FEF2F2; color:#DC2626; border:1px solid #EF4444; font-weight:800;'
          : 'background:#FFFBEB; color:#B45309; border:1px solid #FDE68A;');

    var fsBtnHtml = '';
    if (fsSupported && !fsActive) {
      fsBtnHtml =
        '<button type="button" onclick="window.StudentQuizSecurity && window.StudentQuizSecurity.requestFullscreen()" ' +
        'class="quiz-sec-fs-btn" title="Enter Full-Screen Exam Mode">' +
        '⛶ Full Screen' +
        '</button>';
    } else if (fsActive) {
      fsBtnHtml = '<span style="font-size:0.75rem; color:#047857; font-weight:700;">✓ Full Screen Active</span>';
    }

    strip.innerHTML =
      '<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">' +
        '<span style="display:inline-flex; align-items:center; gap:0.35rem; font-weight:700; color:#0B1F3A; font-size:0.78rem;">' +
          '🛡️ Protected Quiz Session' +
        '</span>' +
        '<span style="font-size:0.76rem; color:#475569;">Candidate: <strong>' + studentBadge + '</strong></span>' +
      '</div>' +
      '<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">' +
        fsBtnHtml +
        '<span style="padding:0.2rem 0.6rem; border-radius:999px; font-size:0.75rem; font-weight:700; ' + violationColor + '">' +
          'Focus Warnings: ' + Math.min(state.violationCount, maxV) + ' / ' + maxV + (state.violationCount >= maxV ? ' (Auto-Submitting)' : '') +
        '</span>' +
      '</div>';
  }

  function setBlurCurtain(shouldBlur) {
    var qCard = document.querySelector('#view-runner .question-card');
    if (!qCard) return;
    if (shouldBlur && isRunnerVisible()) {
      qCard.classList.add('quiz-blur-curtain');
    } else {
      qCard.classList.remove('quiz-blur-curtain');
    }
  }

  function showSecurityWarningModal(title, message, showFullscreenBtn, isFinalAutoSubmit) {
    var modal = document.getElementById('quizSecurityWarningModal');
    if (!modal) return;
    var titleEl = document.getElementById('quizSecWarnTitle');
    var badgeEl = document.getElementById('quizSecWarnCountBadge');
    var msgEl = document.getElementById('quizSecWarnMessage');
    var fsBtn = document.getElementById('quizSecReenterFsBtn');
    var ackBtn = document.getElementById('quizSecAckBtn');
    var maxV = (state.maxViolations > 0) ? state.maxViolations : 5;
    var isLimitReached = Boolean(isFinalAutoSubmit || state.violationCount >= maxV);

    if (titleEl) {
      titleEl.textContent = isLimitReached ? 'Maximum Allowed Warnings Reached' : (title || 'Please Remain on the Quiz Screen');
    }

    if (badgeEl) {
      if (isLimitReached) {
        badgeEl.textContent = 'Recorded Warning ' + maxV + ' of ' + maxV + ' — Limit Reached';
        badgeEl.style.color = '#DC2626';
        badgeEl.style.fontWeight = '800';
      } else {
        badgeEl.textContent = 'Recorded Warning ' + state.violationCount + ' of ' + maxV;
        badgeEl.style.color = state.violationCount >= (maxV - 1) ? '#DC2626' : '#D97706';
        badgeEl.style.fontWeight = '700';
      }
    }

    if (msgEl) {
      if (isLimitReached) {
        msgEl.innerHTML =
          '<strong>Exam Security Limit Reached:</strong> You have received <strong>' + maxV + ' of ' + maxV + '</strong> ' +
          'focus/tab-switch warnings. Per examination policy, your quiz is being <strong>automatically submitted now</strong>.';
      } else {
        var remaining = Math.max(0, maxV - state.violationCount);
        var warnNote = (remaining === 1)
          ? '<div style="margin-top:0.5rem; font-weight:700; color:#DC2626;">⚠️ FINAL WARNING: 1 more focus loss or tab switch will automatically submit your quiz!</div>'
          : '<div style="margin-top:0.5rem; font-size:0.78rem; color:#64748B;">Notice: The quiz will automatically submit after ' + maxV + ' warnings. (' + remaining + ' warnings remaining)</div>';
        msgEl.innerHTML = (message ? ('<div>' + message + '</div>') : '') + warnNote;
      }
    }

    if (fsBtn) {
      fsBtn.style.display = (!isLimitReached && showFullscreenBtn && checkFullscreenSupport() && !isFullscreenActive()) ? 'inline-flex' : 'none';
    }

    if (ackBtn) {
      if (isLimitReached) {
        ackBtn.className = 'btn btn-danger';
        ackBtn.disabled = true;
        ackBtn.style.cursor = 'not-allowed';
        ackBtn.innerHTML = '<span style="display:inline-block; width:13px; height:13px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:quizSecSpin 0.8s linear infinite; margin-right:7px; vertical-align:middle;"></span> Submitting Quiz Responses...';
      } else {
        ackBtn.className = 'btn btn-primary';
        ackBtn.disabled = false;
        ackBtn.style.cursor = 'pointer';
        ackBtn.textContent = 'I Understand — Resume Quiz';
      }
    }

    modal.classList.add('active');
  }

  // ---------------------------------------------------------------------------
  // 2. Violation Recording with Incident Deduplication
  // ---------------------------------------------------------------------------
  function recordFocusOrVisibilityIncident(eventType, humanMessage, showFsBtn) {
    if (!isRunnerVisible()) return;
    if (state.isSubmitting) return;

    var now = Date.now();
    // Ignore events during initial grace window (e.g. browser fullscreen transition)
    if (now - state.startedAtMs < INITIAL_GRACE_MS) {
      return;
    }
    // Deduplicate simultaneous blur + visibilitychange events from the same incident
    if (now - state.lastIncidentAt < DEDUP_WINDOW_MS) {
      return;
    }
    state.lastIncidentAt = now;
    state.violationCount++;

    if (eventType === 'tab_switch') state.tabSwitchCount++;
    else if (eventType === 'window_blur') state.blurCount++;
    else if (eventType === 'fullscreen_exit') state.fullscreenExitCount++;

    var maxV = (state.maxViolations > 0) ? state.maxViolations : 5;

    // Check if maximum warnings limit is reached (e.g. after 5 warnings)
    if (state.violationCount >= maxV) {
      state.isSubmitting = true;
      state.violationCount = maxV; // Cap so it never displays > maxV (e.g. never 6 or 7)
      updateSecurityStatusBar();
      logBackendSecurityEvent(eventType, {
        reason: humanMessage || 'max_violations_auto_submit',
        violationCount: maxV,
        action: 'auto_submit'
      });

      // Show final auto-submit warning modal with disabled button
      showSecurityWarningModal('Maximum Allowed Warnings Reached', '', false, true);

      // Execute auto-submit callback
      if (typeof state.onAutoSubmitCallback === 'function') {
        setTimeout(function () {
          state.onAutoSubmitCallback('max_security_violations');
        }, 500);
      }
      return;
    }

    updateSecurityStatusBar();
    logBackendSecurityEvent(eventType, { reason: humanMessage });
    showSecurityWarningModal('Please Remain on the Quiz Screen', humanMessage, Boolean(showFsBtn), false);
  }

  // ---------------------------------------------------------------------------
  // 3. Scoped Event Listeners (Active Only During Student Quiz Attempt)
  // ---------------------------------------------------------------------------
  function onCopyCutPaste(e) {
    if (!isRunnerVisible()) return;
    if (isInsideRunner(e.target)) {
      e.preventDefault();
      state.copyAttemptCount++;
      logBackendSecurityEvent('clipboard_' + e.type, { blocked: true });
      if (typeof window.showToast === 'function') {
        window.showToast('Copying, cutting, and pasting are disabled during an active quiz.', 'warning');
      }
    }
  }

  function onContextMenu(e) {
    if (!isRunnerVisible()) return;
    if (isInsideRunner(e.target)) {
      e.preventDefault();
      logBackendSecurityEvent('right_click', { blocked: true });
      return false;
    }
  }

  function onDragOrSelectStart(e) {
    if (!isRunnerVisible()) return;
    if (isInsideRunner(e.target)) {
      // Allow clicking buttons/inputs normally, only prevent text selection & dragging
      if (e.type === 'dragstart') {
        e.preventDefault();
      }
    }
  }

  function onKeyDown(e) {
    if (!isRunnerVisible()) return;
    var key = (e.key || '').toLowerCase();
    var ctrlOrCmd = Boolean(e.ctrlKey || e.metaKey);

    // Detect PrintScreen key
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      setBlurCurtain(true);
      logBackendSecurityEvent('screenshot_key_detected', { key: 'PrintScreen' });
      if (typeof window.showToast === 'function') {
        window.showToast('Screenshots and screen capture are restricted during the assessment.', 'warning');
      }
      setTimeout(function () { setBlurCurtain(false); }, 1800);
      return;
    }

    // Block Ctrl/Cmd + C, X, V, P (Print), S (Save), U (View Source)
    if (ctrlOrCmd && ['c', 'x', 'v', 'p', 's', 'u'].indexOf(key) !== -1) {
      e.preventDefault();
      e.stopPropagation();
      logBackendSecurityEvent('shortcut_blocked', { shortcut: (e.ctrlKey ? 'Ctrl+' : 'Cmd+') + key.toUpperCase() });
      if (typeof window.showToast === 'function') {
        window.showToast('Keyboard shortcut (' + key.toUpperCase() + ') is disabled during an active quiz.', 'warning');
      }
    }
  }

  function onVisibilityChange() {
    if (!isRunnerVisible()) return;
    if (document.hidden) {
      setBlurCurtain(true);
      recordFocusOrVisibilityIncident(
        'tab_switch',
        'You switched away from the quiz tab or minimized the browser. Repeated tab or app switches are logged for your instructor.',
        true
      );
    } else {
      setBlurCurtain(false);
    }
  }

  function onWindowBlur() {
    if (!isRunnerVisible()) return;
    // Avoid firing duplicate incident if visibilitychange already handled it
    setTimeout(function () {
      if (!isRunnerVisible()) return;
      if (document.hidden) return; // Handled by onVisibilityChange
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'IFRAME' || isInsideRunner(activeEl))) {
        return;
      }
      recordFocusOrVisibilityIncident(
        'window_blur',
        'The quiz window lost focus. Please avoid opening other windows, tabs, or external applications while taking the test.',
        false
      );
    }, 120);
  }

  function onWindowFocus() {
    if (!isRunnerVisible()) return;
    setBlurCurtain(false);
  }

  function onFullscreenChange() {
    if (!isRunnerVisible()) return;
    updateSecurityStatusBar();
    if (state.wasFullscreenEntered && !isFullscreenActive()) {
      recordFocusOrVisibilityIncident(
        'fullscreen_exit',
        'You exited full-screen mode during an active quiz. Click "Re-Enter Full Screen" below to continue comfortably.',
        true
      );
    }
  }

  function onBeforeUnload(e) {
    if (!isRunnerVisible()) return;
    var msg = 'Your quiz attempt is currently in progress. Leaving or reloading this page may interrupt your exam.';
    e.preventDefault();
    e.returnValue = msg;
    return msg;
  }

  function onDocumentLinkClick(e) {
    if (!isRunnerVisible()) return;
    var anchor = e.target && e.target.closest ? e.target.closest('a[href], .nav-tab') : null;
    if (!anchor) return;

    // Block clicking external links, sidebar links, or sub-nav tabs while quiz is in progress
    var href = anchor.getAttribute ? (anchor.getAttribute('href') || '') : '';
    var isSubNavTab = anchor.classList && anchor.classList.contains('nav-tab');
    if (isSubNavTab || (href && href !== '#' && !href.startsWith('javascript:'))) {
      e.preventDefault();
      e.stopPropagation();
      logBackendSecurityEvent('navigation_blocked', { target: href || 'tab_switch_attempt' });
      showSecurityWarningModal(
        'Navigation Restricted During Active Quiz',
        'You cannot open other ERP pages or external links while your quiz attempt is in progress. Please submit your quiz first if you wish to leave.',
        false
      );
    }
  }

  function onPopState() {
    if (!isRunnerVisible()) return;
    // Push state back so accidental mobile Back gesture doesn't leave the quiz
    try {
      window.history.pushState({ quizActive: true }, document.title, window.location.href);
    } catch (err) {}
    showSecurityWarningModal(
      'Back Navigation Disabled During Quiz',
      'Browser Back navigation is disabled so you do not accidentally lose your active quiz screen. Use the "Previous" and "Next" buttons inside the quiz, or click "Review & Submit Quiz" when finished.',
      false
    );
  }

  function onBeforePrint() {
    if (!isRunnerVisible()) return;
    setBlurCurtain(true);
    logBackendSecurityEvent('print_attempt', { blocked: true });
  }

  function onAfterPrint() {
    if (!isRunnerVisible()) return;
    setBlurCurtain(false);
  }

  function attachListeners() {
    document.addEventListener('copy', onCopyCutPaste, true);
    document.addEventListener('cut', onCopyCutPaste, true);
    document.addEventListener('paste', onCopyCutPaste, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('dragstart', onDragOrSelectStart, true);
    document.addEventListener('selectstart', onDragOrSelectStart, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onDocumentLinkClick, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
  }

  function detachListeners() {
    document.removeEventListener('copy', onCopyCutPaste, true);
    document.removeEventListener('cut', onCopyCutPaste, true);
    document.removeEventListener('paste', onCopyCutPaste, true);
    document.removeEventListener('contextmenu', onContextMenu, true);
    document.removeEventListener('dragstart', onDragOrSelectStart, true);
    document.removeEventListener('selectstart', onDragOrSelectStart, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('blur', onWindowBlur);
    window.removeEventListener('focus', onWindowFocus);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.removeEventListener('click', onDocumentLinkClick, true);
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('beforeprint', onBeforePrint);
    window.removeEventListener('afterprint', onAfterPrint);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------------------------------------------------------------------------
  // 4. Public API
  // ---------------------------------------------------------------------------
  var StudentQuizSecurity = {
    start: function (options) {
      options = options || {};
      this.stop(); // Reset any prior session cleanly

      state.isActive = true;
      state.isSubmitting = false;
      state.attemptId = options.attemptId || null;
      state.quizId = options.quizId || null;
      state.studentName = options.studentName || 'Student';
      state.studentCode = options.studentCode || '';
      state.rollNo = options.rollNo || '';
      state.className = options.className || '';
      state.maxViolations = (options.maxViolations !== undefined && options.maxViolations !== null && Number(options.maxViolations) > 0)
        ? Number(options.maxViolations)
        : 5;
      state.autoSubmitOnMaxViolations = (options.autoSubmitOnMaxViolations !== undefined && options.autoSubmitOnMaxViolations !== null)
        ? Boolean(options.autoSubmitOnMaxViolations)
        : true;
      state.onAutoSubmitCallback = typeof options.onAutoSubmit === 'function' ? options.onAutoSubmit : null;

      // Reset attempt-specific counters
      state.violationCount = 0;
      state.tabSwitchCount = 0;
      state.blurCount = 0;
      state.fullscreenExitCount = 0;
      state.copyAttemptCount = 0;
      state.lastIncidentAt = 0;
      state.startedAtMs = Date.now();
      state.wasFullscreenEntered = false;

      try {
        window.history.pushState({ quizActive: true }, document.title, window.location.href);
      } catch (e) {}

      ensureSecurityUIMounted();
      attachListeners();

      // Refresh watermark timestamp every 60s
      state.watermarkInterval = setInterval(function () {
        if (isRunnerVisible()) {
          renderWatermarkTiles();
        }
      }, 60000);

      // Request fullscreen on student's explicit Start Quiz click (graceful if declined/unsupported)
      if (options.requestFullscreen !== false) {
        requestExamFullscreen();
      }
    },

    markSubmitting: function () {
      state.isSubmitting = true;
      var maxV = (state.maxViolations > 0) ? state.maxViolations : 5;
      // If we are auto-submitting on max violations, keep the warning modal visible with the spinner
      if (state.violationCount < maxV) {
        var modal = document.getElementById('quizSecurityWarningModal');
        if (modal) modal.classList.remove('active');
      }
      setBlurCurtain(false);
    },

    stop: function () {
      state.isActive = false;
      state.isSubmitting = false;
      if (state.watermarkInterval) {
        clearInterval(state.watermarkInterval);
        state.watermarkInterval = null;
      }
      detachListeners();
      setBlurCurtain(false);

      var runner = document.getElementById('view-runner');
      if (runner) runner.classList.remove('quiz-secure-active');

      var modal = document.getElementById('quizSecurityWarningModal');
      if (modal) modal.classList.remove('active');

      exitExamFullscreen();
    },

    requestFullscreen: function () {
      return requestExamFullscreen();
    },

    getSummary: function () {
      return {
        violationCount: state.violationCount,
        tabSwitchCount: state.tabSwitchCount,
        blurCount: state.blurCount,
        fullscreenExitCount: state.fullscreenExitCount,
        copyAttemptCount: state.copyAttemptCount
      };
    }
  };

  window.StudentQuizSecurity = StudentQuizSecurity;
})(window, document);

