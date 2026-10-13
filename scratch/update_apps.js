const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../frontend/js/app.js'),
  path.join(__dirname, '../frontend/js/teacher-app.js')
];

targetFiles.forEach(targetFile => {
  if (!fs.existsSync(targetFile)) return;
  let code = fs.readFileSync(targetFile, 'utf8');

  // 1. Add AddLectureModal state and methods to TeacherApp
  const modalMethods = `
  _addLectureModalState: null,
  syllabusActiveTab: 'curriculum',
  syllabusHistorySearch: '',

  switchSyllabusTab(tab) {
    this.syllabusActiveTab = tab;
    this.renderSyllabusView();
  },

  filterSyllabusHistory(query) {
    this.syllabusHistorySearch = query;
    this.renderSyllabusView();
  },

  openAddLectureModal(subjectId, unitId, topicId) {
    const all = TeacherERPData.loadSyllabusData();
    const subject = all.find(s => s.subjectId === subjectId);
    const unit = subject?.units?.find(u => u.unitId === unitId);
    const topic = unit?.topics?.find(t => t.topicId === topicId);
    if (!topic) return;

    const nextLectureNo = (topic.lectures ? topic.lectures.length : 0) + 1;
    const today = (typeof AcademicDateUtils !== 'undefined' && AcademicDateUtils.getTodayISO)
      ? AcademicDateUtils.getTodayISO()
      : new Date().toISOString().split('T')[0];

    const desc = topic.topicDescription || topic.topicName;
    const suggestions = desc
      .split(/[,;•\\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !s.toLowerCase().startsWith('such as') && !s.toLowerCase().startsWith('e.g.'));

    const initialTag = suggestions.length > 0 ? (suggestions[(nextLectureNo - 1) % suggestions.length] || topic.topicName) : topic.topicName;

    this._addLectureModalState = {
      subjectId,
      unitId,
      topicId,
      subjectName: subject.subjectName,
      unitName: unit.unitName,
      topicName: topic.topicName,
      nextLectureNo,
      suggestions,
      tags: [initialTag]
    };

    let modalEl = document.getElementById("addLectureModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "addLectureModal";
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = \`
      <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(11,31,58,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px;">
        <div style="background:#fff; border-radius:14px; width:100%; max-width:640px; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 24px 48px rgba(0,0,0,0.25); overflow:hidden;">
          <!-- Header -->
          <div style="background:#0B1F3A; color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="background:#0B5CAD; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; letter-spacing:0.5px;">LECTURE \${nextLectureNo}</span>
                <h3 style="margin:0; font-size:17px; font-weight:800; color:#fff;">Record New Lecture</h3>
              </div>
              <p style="margin:0; font-size:12.5px; color:#94A3B8;">
                <strong>\${subject.subjectName}</strong> • \${unit.unitName.split(':')[0]} • <strong>\${topic.topicName}</strong>
              </p>
            </div>
            <button type="button" onclick="TeacherApp.closeAddLectureModal()" style="background:transparent; border:none; color:#94A3B8; font-size:22px; cursor:pointer; line-height:1;">✕</button>
          </div>

          <!-- Body -->
          <div style="flex:1; overflow-y:auto; padding:22px 24px;">
            <!-- Date & Time Slot -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:18px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Date of Lecture *</label>
                <input type="date" id="addLectureDate" value="\${today}" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; color:#0B1F3A; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Class Time Slot</label>
                <select id="addLectureTimeSlot" style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; color:#0B1F3A; background:#fff; box-sizing:border-box;">
                  <option value="09:00 - 10:30 AM">09:00 - 10:30 AM (Slot 1)</option>
                  <option value="11:00 - 12:30 PM">11:00 - 12:30 PM (Slot 2)</option>
                  <option value="01:15 - 02:15 PM">01:15 - 02:15 PM (Slot 3)</option>
                  <option value="02:15 - 03:15 PM">02:15 - 03:15 PM (Slot 4)</option>
                  <option value="03:30 - 05:00 PM">03:30 - 05:00 PM (Slot 5)</option>
                </select>
              </div>
            </div>

            <!-- Topics Covered Tags -->
            <div style="margin-bottom:18px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Topics Covered in This Lecture *</label>
              <p style="margin:0 0 8px 0; font-size:11.5px; color:#64748B;">
                Specify concepts/modules delivered. Type and press <strong>Enter</strong> or click <strong>+ Add Topic</strong>.
              </p>
              <div style="display:flex; gap:8px; margin-bottom:10px;">
                <input type="text" id="addLectureTagInput" placeholder="e.g., Row-Major Ordering, Base Address calculation..." onkeydown="if(event.key==='Enter'){event.preventDefault();TeacherApp.addModalLectureTag();}" style="flex:1; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:13px; box-sizing:border-box;">
                <button type="button" onclick="TeacherApp.addModalLectureTag()" style="background:#0B5CAD; color:#fff; border:none; padding:9px 18px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer;">
                  + Add Topic
                </button>
              </div>

              <!-- Tags container -->
              <div id="addLectureTagsList" style="min-height:44px; padding:8px 12px; background:#F8FAFC; border:1px dashed #CBD5E1; border-radius:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
              </div>

              <!-- Suggestions -->
              \${suggestions.length > 0 ? \`
                <div style="margin-top:8px;">
                  <span style="font-size:11px; color:#64748B; font-weight:600;">Quick add from curriculum:</span>
                  <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
                    \${suggestions.slice(0, 4).map(s => \`
                      <button type="button" onclick="TeacherApp.selectModalSuggestion('\${s.replace(/'/g, "\\\\'")}')" style="background:#fff; border:1px solid #CBD5E1; border-radius:12px; padding:3px 8px; font-size:11px; color:#475569; cursor:pointer; font-weight:600;">
                        + \${s}
                      </button>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
            </div>

            <!-- Notes -->
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:6px;">Lecture Delivery Notes (Optional)</label>
              <textarea id="addLectureNotes" rows="3" placeholder="e.g. Completed slide deck 4, student exercise assigned, homework assigned." style="width:100%; padding:9px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; color:#0B1F3A; box-sizing:border-box; resize:vertical;"></textarea>
            </div>

            <!-- Notice -->
            <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:10px 14px; font-size:12px; color:#166534; display:flex; align-items:center; gap:8px;">
              <span>💡</span>
              <span>Once this lecture is saved, student attendance can be marked immediately from the curriculum card or history log.</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:14px 24px; border-top:1px solid #E2E8F0; display:flex; justify-content:flex-end; gap:12px; background:#F8FAFC;">
            <button type="button" onclick="TeacherApp.closeAddLectureModal()" style="background:#fff; color:#64748B; border:1px solid #CBD5E1; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
              Cancel
            </button>
            <button type="button" onclick="TeacherApp.submitAddLecture('\${subjectId}', '\${unitId}', '\${topicId}')" style="background:#0B5CAD; color:#fff; border:none; padding:8px 22px; border-radius:6px; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 2px 6px rgba(11,92,173,0.25);">
              + Record &amp; Add Lecture
            </button>
          </div>
        </div>
      </div>
    \`;

    this.renderModalTagsList();
  },

  renderModalTagsList() {
    const listEl = document.getElementById("addLectureTagsList");
    if (!listEl || !this._addLectureModalState) return;
    const tags = this._addLectureModalState.tags || [];

    if (tags.length === 0) {
      listEl.innerHTML = '<span style="font-size:12px; color:#94A3B8;">No topic tags added yet. Please add at least one topic covered.</span>';
      return;
    }

    listEl.innerHTML = tags.map(tag => \`
      <span style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; padding:4px 10px; border-radius:16px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
        🏷️ \${tag}
        <button type="button" onclick="TeacherApp.removeModalLectureTag('\${tag.replace(/'/g, "\\\\'")}')" style="background:transparent; border:none; color:#1D4ED8; cursor:pointer; padding:0; font-size:14px; line-height:1; font-weight:bold;">×</button>
      </span>
    \`).join('');
  },

  addModalLectureTag() {
    const input = document.getElementById("addLectureTagInput");
    if (!input || !this._addLectureModalState) return;
    const val = input.value.trim();
    if (val && !this._addLectureModalState.tags.includes(val)) {
      this._addLectureModalState.tags.push(val);
      this.renderModalTagsList();
    }
    input.value = "";
  },

  removeModalLectureTag(tag) {
    if (!this._addLectureModalState) return;
    this._addLectureModalState.tags = this._addLectureModalState.tags.filter(t => t !== tag);
    this.renderModalTagsList();
  },

  selectModalSuggestion(tag) {
    if (!this._addLectureModalState) return;
    if (!this._addLectureModalState.tags.includes(tag)) {
      this._addLectureModalState.tags.push(tag);
      this.renderModalTagsList();
    }
  },

  closeAddLectureModal() {
    const el = document.getElementById("addLectureModal");
    if (el) el.innerHTML = "";
    this._addLectureModalState = null;
  },

  submitAddLecture(subjectId, unitId, topicId) {
    const dateInput = document.getElementById("addLectureDate");
    const slotInput = document.getElementById("addLectureTimeSlot");
    const notesInput = document.getElementById("addLectureNotes");

    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const timeSlot = slotInput ? slotInput.value : '09:00 - 10:30 AM';
    const notes = notesInput ? notesInput.value.trim() : '';
    const tags = (this._addLectureModalState && this._addLectureModalState.tags.length > 0)
      ? this._addLectureModalState.tags
      : [(this._addLectureModalState ? this._addLectureModalState.topicName : 'Core Lecture Delivery')];

    const res = TeacherERPData.addLectureToTopic(subjectId, unitId, topicId, {
      date,
      timeSlot,
      topicsCovered: tags,
      notes
    });

    this.closeAddLectureModal();

    if (res && res.newLecture) {
      if (typeof this.showToast === 'function') {
        this.showToast(\`✓ Lecture \${res.newLecture.lectureNo} added for "\${res.newLecture.topicName}" (\${tags.length} topics covered). You can now mark attendance.\`, 'success');
      }
      this.renderSyllabusView();
    } else {
      if (typeof this.showToast === 'function') {
        this.showToast('Could not add lecture to topic.', 'error');
      }
    }
  },
`;

  // Insert modalMethods before `addLectureToTopic(subjectId, unitId, topicId) {`
  const addLectureToken = "  addLectureToTopic(subjectId, unitId, topicId) {";
  if (code.indexOf(addLectureToken) !== -1 && code.indexOf("openAddLectureModal") === -1) {
    code = code.replace(addLectureToken, modalMethods + "\n" + addLectureToken);
    console.log("Added modal methods to", targetFile);
  }

  // 2. Enhance openLectureAttendanceModal to show topicsCovered tags in modal header
  const attModalSubOld = `<p style="margin:0; font-size:12.5px; color:#94A3B8;">
                <strong>\${subjectName || subject.subjectName}</strong> • Topic: <strong>\${topicName || topic.topicName}</strong> • Class: <strong>\${classId}</strong> • Date: <strong>\${date || lecture.date}</strong>
              </p>`;

  const attModalSubNew = `<p style="margin:0; font-size:12.5px; color:#94A3B8;">
                <strong>\${subjectName || subject.subjectName}</strong> • Topic: <strong>\${topicName || topic.topicName}</strong> • Class: <strong>\${classId}</strong> • Date: <strong>\${date || lecture.date}</strong>
              </p>
              \${Array.isArray(lecture.topicsCovered) && lecture.topicsCovered.length > 0 ? \`
                <div style="display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:wrap;">
                  <span style="font-size:11px; color:#CBD5E1; font-weight:600;">Topics Covered:</span>
                  \${lecture.topicsCovered.map(t => \`
                    <span style="background:rgba(255,255,255,0.18); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:1px 8px; border-radius:12px; font-size:11px; font-weight:600;">
                      🏷️ \${t}
                    </span>
                  \`).join('')}
                </div>
              \` : ''}`;

  code = code.replace(attModalSubOld, attModalSubNew);

  fs.writeFileSync(targetFile, code, 'utf8');
  console.log("Updated methods in", targetFile);
});

