/**
 * College ERP - Swipe & Gesture Attendance Engine
 * Pointer Events (Mouse, Touch, Pen), physics-based drag, tilt & fling animations,
 * dynamic PRESENT/ABSENT stamps, and desktop/keyboard controls.
 */

class SwipeAttendanceEngine {
  constructor(options) {
    this.container = options.container;
    this.students = options.students || [];
    this.currentIndex = options.currentIndex || 0;
    this.onMark = options.onMark || (() => {});
    this.onUndo = options.onUndo || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onProgressChange = options.onProgressChange || (() => {});

    this.history = []; // stack of { index, previousStatus }
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.threshold = 90; // pixels to trigger swipe
    this.isAnimating = false;

    this.activeCard = null;
    this.nextCard = null;

    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.initKeyboard();
  }

  initKeyboard() {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keydown", this.boundKeyDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.boundKeyDown);
    if (this.activeCard) {
      this.activeCard.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  setStudents(students, startIndex = 0) {
    this.students = students;
    this.currentIndex = startIndex;
    this.history = [];
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    if (this.currentIndex >= this.students.length) {
      this.onComplete();
      return;
    }

    const currentStudent = this.students[this.currentIndex];
    const nextStudent = this.students[this.currentIndex + 1] || null;

    // Card Stack container
    const stackWrap = document.createElement("div");
    stackWrap.className = "swipe-stack";

    // Next Card (underneath for depth)
    if (nextStudent) {
      const nextCardEl = this.createCardElement(nextStudent, false);
      nextCardEl.classList.add("card-next");
      stackWrap.appendChild(nextCardEl);
      this.nextCard = nextCardEl;
    } else {
      this.nextCard = null;
    }

    // Active Top Card
    const activeCardEl = this.createCardElement(currentStudent, true);
    activeCardEl.classList.add("card-active");
    stackWrap.appendChild(activeCardEl);
    this.activeCard = activeCardEl;

    this.container.appendChild(stackWrap);

    // Attach pointer events to active top card
    this.activeCard.addEventListener("pointerdown", this.boundPointerDown);

    this.notifyProgress();
  }

  createCardElement(student, isActive) {
    const card = document.createElement("div");
    card.className = "student-swipe-card";
    card.setAttribute("data-roll", student.roll);
    card.setAttribute("tabindex", isActive ? "0" : "-1");

    // Dynamic Swipe Stamps / Badges
    const stampPresent = document.createElement("div");
    stampPresent.className = "swipe-stamp stamp-present";
    stampPresent.innerHTML = `<span>✓ PRESENT</span>`;

    const stampAbsent = document.createElement("div");
    stampAbsent.className = "swipe-stamp stamp-absent";
    stampAbsent.innerHTML = `<span>✕ ABSENT</span>`;

    card.appendChild(stampPresent);
    card.appendChild(stampAbsent);

    // Card Inner Content
    const inner = document.createElement("div");
    inner.className = "card-inner-content";

    inner.innerHTML = `
      <div class="card-dept-badge">
        <span class="roll-pill">${student.rollFormatted}</span>
        <span class="prn-text">${student.prn}</span>
      </div>

      <div class="card-student-focus">
        <div class="huge-roll">${student.rollFormatted}</div>
        <div class="huge-name">${student.name}</div>
      </div>

      <div class="card-footer-hints">
        <div class="swipe-hint-left">
          <span class="hint-arrow">←</span>
          <span class="hint-label">SWIPE LEFT: ABSENT</span>
        </div>
        <div class="swipe-hint-center">
          <span class="hint-dots">••••</span>
        </div>
        <div class="swipe-hint-right">
          <span class="hint-label">SWIPE RIGHT: PRESENT</span>
          <span class="hint-arrow">→</span>
        </div>
      </div>
    `;

    card.appendChild(inner);
    return card;
  }

  handlePointerDown(e) {
    if (this.isAnimating) return;
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = 0;
    this.currentY = 0;

    this.activeCard.setPointerCapture(e.pointerId);
    this.activeCard.classList.add("is-dragging");

    this.activeCard.addEventListener("pointermove", this.boundPointerMove);
    this.activeCard.addEventListener("pointerup", this.boundPointerUp);
    this.activeCard.addEventListener("pointercancel", this.boundPointerUp);
  }

  handlePointerMove(e) {
    if (!this.isDragging || !this.activeCard) return;

    this.currentX = e.clientX - this.startX;
    this.currentY = e.clientY - this.startY;

    const rotation = this.currentX * 0.08; // smooth tilt angle
    this.activeCard.style.transform = `translate3d(${this.currentX}px, ${this.currentY * 0.4}px, 0) rotate(${rotation}deg)`;

    // Update Stamps Opacity
    const presentStamp = this.activeCard.querySelector(".stamp-present");
    const absentStamp = this.activeCard.querySelector(".stamp-absent");

    const ratio = Math.min(Math.abs(this.currentX) / this.threshold, 1);

    if (this.currentX > 15) {
      if (presentStamp) {
        presentStamp.style.opacity = (ratio * 0.95).toFixed(2);
        presentStamp.style.transform = `rotate(-14deg) scale(${0.85 + ratio * 0.25})`;
      }
      if (absentStamp) absentStamp.style.opacity = "0";
    } else if (this.currentX < -15) {
      if (absentStamp) {
        absentStamp.style.opacity = (ratio * 0.95).toFixed(2);
        absentStamp.style.transform = `rotate(14deg) scale(${0.85 + ratio * 0.25})`;
      }
      if (presentStamp) presentStamp.style.opacity = "0";
    } else {
      if (presentStamp) presentStamp.style.opacity = "0";
      if (absentStamp) absentStamp.style.opacity = "0";
    }

    // Next card scaling feedback underneath
    if (this.nextCard) {
      const nextScale = 0.94 + ratio * 0.06;
      const nextTranslateY = 16 - ratio * 16;
      this.nextCard.style.transform = `translateY(${nextTranslateY}px) scale(${nextScale})`;
    }
  }

  handlePointerUp(e) {
    if (!this.isDragging || !this.activeCard) return;
    this.isDragging = false;

    this.activeCard.classList.remove("is-dragging");
    this.activeCard.removeEventListener("pointermove", this.boundPointerMove);
    this.activeCard.removeEventListener("pointerup", this.boundPointerUp);
    this.activeCard.removeEventListener("pointercancel", this.boundPointerUp);

    try {
      this.activeCard.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Check threshold
    if (this.currentX > this.threshold) {
      this.flingCard("present");
    } else if (this.currentX < -this.threshold) {
      this.flingCard("absent");
    } else {
      // Snap back to center
      this.activeCard.style.transition = "transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      this.activeCard.style.transform = "translate3d(0, 0, 0) rotate(0deg)";

      const presentStamp = this.activeCard.querySelector(".stamp-present");
      const absentStamp = this.activeCard.querySelector(".stamp-absent");
      if (presentStamp) presentStamp.style.opacity = "0";
      if (absentStamp) absentStamp.style.opacity = "0";

      if (this.nextCard) {
        this.nextCard.style.transition = "transform 0.28s ease";
        this.nextCard.style.transform = "translateY(16px) scale(0.94)";
      }

      setTimeout(() => {
        if (this.activeCard) this.activeCard.style.transition = "";
        if (this.nextCard) this.nextCard.style.transition = "";
      }, 300);
    }
  }

  flingCard(direction) {
    if (this.isAnimating || !this.activeCard) return;
    this.isAnimating = true;

    const isPresent = direction === "present";
    const travelX = isPresent ? window.innerWidth + 300 : -(window.innerWidth + 300);
    const rotation = isPresent ? 35 : -35;

    const presentStamp = this.activeCard.querySelector(".stamp-present");
    const absentStamp = this.activeCard.querySelector(".stamp-absent");

    if (isPresent && presentStamp) {
      presentStamp.style.opacity = "1";
      presentStamp.style.transform = "rotate(-12deg) scale(1.1)";
    }
    if (!isPresent && absentStamp) {
      absentStamp.style.opacity = "1";
      absentStamp.style.transform = "rotate(12deg) scale(1.1)";
    }

    this.activeCard.style.transition = "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease";
    this.activeCard.style.transform = `translate3d(${travelX}px, 40px, 0) rotate(${rotation}deg)`;
    this.activeCard.style.opacity = "0";

    if (this.nextCard) {
      this.nextCard.style.transition = "transform 0.35s ease, opacity 0.35s ease";
      this.nextCard.style.transform = "translateY(0) scale(1)";
      this.nextCard.style.opacity = "1";
    }

    setTimeout(() => {
      const student = this.students[this.currentIndex];
      this.history.push({
        index: this.currentIndex,
        prevStatus: student.status
      });

      student.status = isPresent ? "present" : "absent";
      this.onMark(student, student.status);

      this.currentIndex++;
      this.isAnimating = false;
      this.render();
    }, 360);
  }

  markPresent() {
    this.flingCard("present");
  }

  markAbsent() {
    this.flingCard("absent");
  }

  undo() {
    if (this.history.length === 0 || this.isAnimating) return;
    const last = this.history.pop();
    this.currentIndex = last.index;
    this.students[this.currentIndex].status = last.prevStatus;
    this.onUndo(this.students[this.currentIndex]);
    this.render();
  }

  skip() {
    if (this.isAnimating || this.currentIndex >= this.students.length) return;
    this.currentIndex++;
    this.render();
  }

  handleKeyDown(e) {
    // Only handle keyboard if student attendance view is currently visible
    const stepEl = document.getElementById("step-attendance-view");
    if (!stepEl || stepEl.classList.contains("hidden")) return;

    // Avoid hijacking input fields or modals
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      this.markPresent();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.markAbsent();
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      this.skip();
    } else if (e.key === "Backspace" || (e.ctrlKey && e.key === "z")) {
      e.preventDefault();
      this.undo();
    }
  }

  notifyProgress() {
    const total = this.students.length;
    const current = Math.min(this.currentIndex + 1, total);
    const presentCount = this.students.filter((s) => s.status === "present").length;
    const absentCount = this.students.filter((s) => s.status === "absent").length;
    const remainingCount = total - (presentCount + absentCount);
    const percent = Math.round(((presentCount + absentCount) / total) * 100);

    this.onProgressChange({
      currentIndex: this.currentIndex,
      currentDisplay: current,
      total,
      presentCount,
      absentCount,
      remainingCount,
      percent
    });
  }
}

