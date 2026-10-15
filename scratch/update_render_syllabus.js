const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../frontend/js/app.js'),
  path.join(__dirname, '../frontend/js/teacher-app.js')
];

targetFiles.forEach(targetFile => {
  if (!fs.existsSync(targetFile)) return;
  let code = fs.readFileSync(targetFile, 'utf8');

  // Find start and end of renderSyllabusView
  const startToken = "  renderSyllabusView() {";
  const endToken = "  // RESULTS VIEW";

  const startIndex = code.indexOf(startToken);
  const endIndex = code.indexOf(endToken);

  if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find renderSyllabusView in", targetFile);
    return;
  }

  const newRenderSyllabusView = `  renderSyllabusView() {
    const container = document.getElementById("syllabus-content");
    if (!container) return;

    // 1. Strict Faculty-Specific Subjects Filter
    const teacher = (typeof this.getLoggedInTeacher === 'function') ? this.getLoggedInTeacher() : null;
    const empCode = teacher?.employeeId || teacher?.empCode || (typeof TeacherERPData !== 'undefined' && TeacherERPData.getActiveTeacherEmpCode ? TeacherERPData.getActiveTeacherEmpCode() : 'EMP-CSE-1001');
    const subjects = TeacherERPData.getSyllabusForTeacher(empCode);

    if (!subjects || subjects.length === 0) {
      container.innerHTML = \`
        <div class="card" style="padding:48px; text-align:center; color:var(--text-muted, #64748B);">
          <i data-lucide="book-open" style="width:48px; height:48px; margin-bottom:12px; opacity:0.4;"></i>
          <h3 style="margin:0 0 8px 0; color:var(--dark-navy, #0B1F3A);">No Subjects Assigned</h3>
          <p style="margin:0; font-size:13px;">There are no subjects assigned to faculty profile <strong>\${empCode}</strong> for syllabus tracking.</p>
        </div>
      \`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Default to first subject if none selected or selected is not in faculty's list
    if (!this.selectedSyllabusSubjectId || !subjects.some(s => s.subjectId === this.selectedSyllabusSubjectId)) {
      this.selectedSyllabusSubjectId = subjects[0].subjectId;
    }

    const currentSub = subjects.find(s => s.subjectId === this.selectedSyllabusSubjectId) || subjects[0];

    // Compute unit-wise, subject totals, and all-lectures list
    let totalPlanned = 0;
    let totalEngaged = 0;
    const unitBreakdown = [];
    const allLecturesList = [];

    (currentSub.units || []).forEach((unit, idx) => {
      let uPlanned = 0;
      let uEngaged = 0;

      (unit.topics || []).forEach(t => {
        const p = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
        const lecs = Array.isArray(t.lectures) ? t.lectures : [];
        const e = lecs.length || Number(t.engagedLectures || t.lecturesTaken || 0);
        uPlanned += p;
        uEngaged += e;

        lecs.forEach(l => {
          allLecturesList.push({
            ...l,
            unitId: unit.unitId,
            unitName: unit.unitName,
            topicId: t.topicId,
            topicName: t.topicName,
            subjectId: currentSub.subjectId,
            subjectName: currentSub.subjectName,
            classId: currentSub.classId
          });
        });
      });

      const uPct = uPlanned > 0 ? Math.min(100, Math.round((uEngaged / uPlanned) * 100)) : 0;
      unitBreakdown.push({
        unitId: unit.unitId,
        unitName: unit.unitName ? unit.unitName.split(':')[0] : \`Unit \${idx+1}\`,
        fullUnitName: unit.unitName,
        planned: uPlanned,
        engaged: uEngaged,
        progress: uPct
      });

      totalPlanned += uPlanned;
      totalEngaged += uEngaged;
    });

    // Sort all lectures descending
    allLecturesList.sort((a, b) => (b.lectureNo || 0) - (a.lectureNo || 0));

    totalPlanned = totalPlanned || Number(currentSub.totalLecturesPlanned || 60);
    const remaining = Math.max(0, totalPlanned - totalEngaged);
    const coveragePercent = totalPlanned > 0 ? Math.min(100, Math.round((totalEngaged / totalPlanned) * 100)) : 0;
    const isOnTrack = coveragePercent >= 45;
    const paceLabel = isOnTrack ? "On Track" : "Behind Schedule";

    const activeTab = this.syllabusActiveTab || 'curriculum';
    const searchQuery = (this.syllabusHistorySearch || '').toLowerCase().trim();

    const filteredLectures = searchQuery
      ? allLecturesList.filter(l => {
          const topMatch = (l.topicName || '').toLowerCase().includes(searchQuery);
          const unitMatch = (l.unitName || '').toLowerCase().includes(searchQuery);
          const tagsMatch = Array.isArray(l.topicsCovered) && l.topicsCovered.some(t => t.toLowerCase().includes(searchQuery));
          const dateMatch = (l.date || '').includes(searchQuery);
          const numMatch = \`lecture \${l.lectureNo}\`.includes(searchQuery);
          return topMatch || unitMatch || tagsMatch || dateMatch || numMatch;
        })
      : allLecturesList;

    container.innerHTML = \`
      <!-- 1. Subject Selector Toolbar -->
      <div class="card" style="padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
          <div>
            <label style="font-size:11px; font-weight:800; color:var(--text-muted, #64748B); text-transform:uppercase; display:block; margin-bottom:4px; letter-spacing:0.5px;">
              Your Assigned Teaching Load (\${subjects.length} Subjects)
            </label>
            <select onchange="TeacherApp.selectSyllabusSubject(this.value)" style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:6px; font-size:13.5px; font-weight:700; background:#F8FAFC; color:var(--dark-navy, #0B1F3A); min-width:260px; cursor:pointer;">
              \${subjects.map(s => \`
                <option value="\${s.subjectId}" \${s.subjectId === currentSub.subjectId ? 'selected' : ''}>
                  \${s.subjectName} (\${s.classId})
                </option>
              \`).join('')}
            </select>
          </div>

          <!-- Quick Subject Pills -->
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
            \${subjects.map(s => \`
              <button type="button" onclick="TeacherApp.selectSyllabusSubject('\${s.subjectId}')" style="background:\${s.subjectId === currentSub.subjectId ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:\${s.subjectId === currentSub.subjectId ? '#fff' : '#475569'}; border:1px solid \${s.subjectId === currentSub.subjectId ? 'var(--dark-navy, #0B1F3A)' : '#CBD5E1'}; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s ease;">
                \${s.subjectName} (\${s.classId})
              </button>
            \`).join('')}
          </div>
        </div>

        <div style="font-size:12.5px; color:var(--text-muted, #64748B);">
          Faculty ID: <strong style="color:var(--dark-navy, #0B1F3A);">\${empCode}</strong>
        </div>
      </div>

      <!-- 2. Syllabus Coverage Analytics & Delivery Pace -->
      <div class="card" style="padding:22px 24px; margin-bottom:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px;">
              <h3 style="margin:0; font-size:17px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                Syllabus Coverage &amp; Lecture Delivery Analysis
              </h3>
              <span style="background:\${isOnTrack ? '#DCFCE7' : '#FEF3C7'}; color:\${isOnTrack ? '#15803D' : '#B45309'}; border:1px solid \${isOnTrack ? '#86EFAC' : '#FDE047'}; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:800;">
                ● \${paceLabel}
              </span>
            </div>
            <p style="margin:4px 0 0 0; font-size:13px; color:var(--text-muted, #64748B);">
              Subject: <strong style="color:var(--dark-navy, #0B1F3A);">\${currentSub.subjectName}</strong> (\${currentSub.subjectCode || 'CS302'}) • Class: <strong style="color:var(--dark-navy, #0B1F3A);">\${currentSub.classId}</strong>
            </p>
          </div>

          <button type="button" onclick="TeacherApp.exportSyllabusCsv('\${currentSub.subjectId}')" style="background:#F8FAFC; color:var(--primary-blue, #0B5CAD); border:1px solid #CBD5E1; padding:7px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            <i data-lucide="download" style="width:14px;height:14px;"></i> Export Syllabus Report (CSV)
          </button>
        </div>

        <!-- Metric Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Overall Coverage</span>
            <div style="font-size:24px; font-weight:800; color:\${isOnTrack ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'}; margin-top:2px;">
              \${coveragePercent}%
            </div>
            <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden; margin-top:8px;">
              <div style="width:\${coveragePercent}%; height:100%; background:\${isOnTrack ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'};"></div>
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Total Planned Lectures</span>
            <div style="font-size:24px; font-weight:800; color:var(--dark-navy, #0B1F3A); margin-top:2px;">\${totalPlanned}</div>
            <span style="font-size:11.5px; color:var(--text-muted, #64748B);">Target academic syllabus</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Lectures Engaged</span>
            <div style="font-size:24px; font-weight:800; color:var(--primary-blue, #0B5CAD); margin-top:2px;">\${totalEngaged}</div>
            <span style="font-size:11.5px; color:var(--success, #10B981); font-weight:600;">Delivered by faculty</span>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px;">
            <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">Remaining Lectures</span>
            <div style="font-size:24px; font-weight:800; color:\${remaining > 0 ? '#B45309' : '#10B981'}; margin-top:2px;">\${remaining}</div>
            <span style="font-size:11.5px; color:var(--text-muted, #64748B);">\${remaining === 0 ? 'Syllabus finished!' : 'To be conducted'}</span>
          </div>
        </div>

        <!-- Unit-wise Progress Breakdown -->
        <div>
          <h4 style="margin:0 0 10px 0; font-size:13px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase;">
            Unit-wise Delivery Breakdown
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
            \${unitBreakdown.map(u => \`
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:12px; font-weight:700; color:var(--dark-navy, #0B1F3A);">\${u.unitName}</span>
                  <span style="font-size:11.5px; font-weight:800; color:\${u.progress >= 100 ? 'var(--success, #10B981)' : 'var(--primary-blue, #0B5CAD)'};">
                    \${u.engaged}/\${u.planned} (\${u.progress}%)
                  </span>
                </div>
                <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                  <div style="width:\${u.progress}%; height:100%; background:\${u.progress >= 100 ? 'var(--success, #10B981)' : (u.progress > 0 ? 'var(--primary-blue, #0B5CAD)' : '#94A3B8')};"></div>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      </div>

      <!-- 3. Navigation Tabs -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:2px solid #E2E8F0; padding-bottom:8px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; gap:10px;">
          <button type="button" onclick="TeacherApp.switchSyllabusTab('curriculum')" style="background:\${activeTab === 'curriculum' ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:\${activeTab === 'curriculum' ? '#fff' : '#475569'}; border:none; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
            📚 Curriculum &amp; Lecture Delivery (\${currentSub.units?.length || 0} Units)
          </button>
          <button type="button" onclick="TeacherApp.switchSyllabusTab('history')" style="background:\${activeTab === 'history' ? 'var(--dark-navy, #0B1F3A)' : '#F1F5F9'}; color:\${activeTab === 'history' ? '#fff' : '#475569'}; border:none; padding:8px 18px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">
            📋 Lecture Delivery History Log (\${allLecturesList.length} Lectures)
          </button>
        </div>

        \${activeTab === 'history' ? \`
          <input type="text" placeholder="Search lectures, topics covered, dates..." value="\${this.syllabusHistorySearch || ''}" oninput="TeacherApp.filterSyllabusHistory(this.value)" style="padding:6px 12px; border-radius:6px; border:1px solid #CBD5E1; font-size:12.5px; min-width:260px;">
        \` : ''}
      </div>

      <!-- Tab Content: Curriculum vs History Log -->
      \${activeTab === 'curriculum' ? \`
        <!-- Curriculum Units & Topics -->
        <div>
          \${(currentSub.units || []).map((unit) => {
            let uPlan = 0;
            let uEng = 0;
            (unit.topics || []).forEach(t => {
              uPlan += Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 0);
              const lCount = Array.isArray(t.lectures) ? t.lectures.length : Number(t.engagedLectures || t.lecturesTaken || 0);
              uEng += lCount;
            });
            const uPct = uPlan > 0 ? Math.min(100, Math.round((uEng / uPlan) * 100)) : 0;
            const uComp = uPct >= 100;
            const uInProg = uPct > 0 && !uComp;

            return \`
              <div class="card" style="margin-bottom:18px; border-radius:12px; overflow:hidden; padding:0;">
                <!-- Unit Header -->
                <div style="background:#F8FAFC; padding:16px 20px; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <h4 style="margin:0 0 3px 0; font-size:15px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                      \${unit.unitName}
                    </h4>
                    <span style="font-size:12px; color:var(--text-muted, #64748B);">
                      \${unit.topics?.length || 0} Topics • \${uEng} of \${uPlan} Lectures Engaged
                    </span>
                  </div>

                  <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:120px; display:flex; flex-direction:column; gap:3px;">
                      <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; color:#475569;">
                        <span>Progress</span>
                        <span>\${uPct}%</span>
                      </div>
                      <div style="width:100%; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                        <div style="width:\${uPct}%; height:100%; background:\${uComp ? '#10B981' : (uInProg ? '#0B5CAD' : '#94A3B8')};"></div>
                      </div>
                    </div>

                    <span style="background:\${uComp ? '#DCFCE7' : (uInProg ? '#FEF3C7' : '#F1F5F9')}; color:\${uComp ? '#15803D' : (uInProg ? '#B45309' : '#64748B')}; border:1px solid \${uComp ? '#86EFAC' : (uInProg ? '#FDE047' : '#CBD5E1')}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800;">
                      \${uComp ? 'Completed' : (uInProg ? 'In Progress' : 'Not Started')}
                    </span>
                  </div>
                </div>

                <!-- Topics List -->
                <div style="padding:16px 20px; background:#FAFAFA;">
                  \${(unit.topics || []).map(topic => {
                    const tPlanned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
                    const lecs = Array.isArray(topic.lectures) ? topic.lectures : [];
                    const tEngaged = lecs.length || Number(topic.engagedLectures || topic.lecturesTaken || 0);
                    const tComp = topic.status === 'Completed' || tEngaged >= tPlanned;
                    const tInProg = topic.status === 'In Progress' || (tEngaged > 0 && !tComp);
                    const tProgress = tPlanned > 0 ? Math.min(100, Math.round((tEngaged / tPlanned) * 100)) : 0;

                    return \`
                      <div style="background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding:16px 18px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                        <!-- Topic Title & Add Lecture Trigger -->
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                          <div style="flex:1 1 260px;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                              <h5 style="margin:0; font-size:14.5px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
                                \${topic.topicName}
                              </h5>
                              <span style="background:\${tComp ? '#DCFCE7' : (tInProg ? '#FEF3C7' : '#F1F5F9')}; color:\${tComp ? '#15803D' : (tInProg ? '#B45309' : '#64748B')}; border:1px solid \${tComp ? '#86EFAC' : (tInProg ? '#FDE047' : '#CBD5E1')}; padding:1px 8px; border-radius:10px; font-size:11px; font-weight:700;">
                                \${tComp ? 'Completed' : (tInProg ? 'In Progress' : 'Not Started')}
                              </span>
                            </div>
                            \${topic.topicDescription ? \`<p style="margin:0; font-size:12px; color:var(--text-muted, #64748B); line-height:1.4;">\${topic.topicDescription}</p>\` : ''}
                          </div>

                          <div style="display:flex; align-items:center; gap:8px;">
                            <button type="button" onclick="TeacherApp.openAddLectureModal('\${currentSub.subjectId}', '\${unit.unitId}', '\${topic.topicId}')" style="background:var(--primary-blue, #0B5CAD); color:#fff; border:none; padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(11,92,173,0.2);">
                              <i data-lucide="plus" style="width:14px;height:14px;"></i> + Add Lecture
                            </button>
                            \${tEngaged > 0 ? \`
                              <button type="button" onclick="TeacherApp.undoLectureFromTopic('\${currentSub.subjectId}', '\${unit.unitId}', '\${topic.topicId}')" title="Undo last added lecture" style="background:#F8FAFC; color:#64748B; border:1px solid #CBD5E1; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">
                                ↩ Undo
                              </button>
                            \` : ''}
                          </div>
                        </div>

                        <!-- Progress Summary -->
                        <div style="background:#F8FAFC; border-radius:8px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                          <span style="font-size:12px; color:#475569;">
                            Lectures Engaged: <strong style="color:var(--dark-navy, #0B1F3A);">\${tEngaged}</strong> of <strong style="color:var(--dark-navy, #0B1F3A);">\${tPlanned}</strong> planned
                          </span>
                          <div style="width:140px; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                            <div style="width:\${tProgress}%; height:100%; background:\${tComp ? '#10B981' : (tInProg ? '#0B5CAD' : '#94A3B8')};"></div>
                          </div>
                        </div>

                        <!-- Lectures List with Topics Covered Chips -->
                        <div>
                          <span style="font-size:11px; font-weight:700; color:var(--text-muted, #64748B); text-transform:uppercase; display:block; margin-bottom:6px;">
                            Delivered Lectures &amp; Topics Covered (\${lecs.length})
                          </span>

                          \${lecs.length === 0 ? \`
                            <div style="padding:10px; background:#FAFAFA; border:1px dashed #CBD5E1; border-radius:6px; text-align:center; font-size:12px; color:var(--text-muted, #64748B);">
                              No lectures recorded yet. Click <strong>+ Add Lecture</strong> after conducting your class.
                            </div>
                          \` : \`
                            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:10px;">
                              \${lecs.map(lec => {
                                const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
                                const covered = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                                  ? lec.topicsCovered
                                  : [topic.topicName];

                                return \`
                                  <div style="background:\${isMarked ? '#F0FDF4' : '#FFFBEB'}; border:1px solid \${isMarked ? '#BBF7D0' : '#FDE68A'}; border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; justify-content:space-between; gap:8px;">
                                    <div>
                                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                        <span style="font-size:13px; font-weight:800; color:\${isMarked ? '#166534' : '#92400E'};">
                                          Lecture \${lec.lectureNo}
                                        </span>
                                        \${isMarked ? \`
                                          <span style="background:#DCFCE7; color:#15803D; font-size:10.5px; font-weight:800; padding:1px 6px; border-radius:10px;">
                                            ✓ Marked
                                          </span>
                                        \` : \`
                                          <span style="background:#FEF3C7; color:#B45309; font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:10px;">
                                            Not Marked
                                          </span>
                                        \`}
                                      </div>
                                      <span style="font-size:11.5px; color:#64748B; display:block; margin-bottom:6px;">
                                        📅 \${lec.date} \${lec.timeSlot ? \`• \${lec.timeSlot}\` : ''}
                                      </span>

                                      <!-- Topics Covered Chips -->
                                      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
                                        \${covered.map(t => \`
                                          <span style="background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; border-radius:12px; padding:1px 8px; font-size:10.5px; font-weight:600; line-height:1.3;">
                                            🏷️ \${t}
                                          </span>
                                        \`).join('')}
                                      </div>

                                      \${lec.notes ? \`
                                        <p style="margin:2px 0 0 0; font-size:11px; color:#475569; font-style:italic;">
                                          📝 \${lec.notes}
                                        </p>
                                      \` : ''}
                                    </div>

                                    <div style="display:flex; justify-content:flex-end; padding-top:6px; border-top:\${isMarked ? '1px solid #DCFCE7' : '1px solid #FEF3C7'};">
                                      <button type="button" onclick="TeacherApp.openLectureAttendanceModal('\${currentSub.subjectId}', '\${unit.unitId}', '\${topic.topicId}', '\${lec.id}', '\${lec.date}', '\${currentSub.classId}', '\${topic.topicName.replace(/'/g, "\\\\'")}', '\${currentSub.subjectName.replace(/'/g, "\\\\'")}')" style="background:\${isMarked ? '#FFFFFF' : 'var(--primary-blue, #0B5CAD)'}; color:\${isMarked ? 'var(--primary-blue, #0B5CAD)' : '#FFFFFF'}; border:\${isMarked ? '1px solid var(--primary-blue, #0B5CAD)' : 'none'}; padding:5px 12px; border-radius:5px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap;">
                                        \${isMarked ? 'View / Edit Attendance' : 'Mark Attendance'}
                                      </button>
                                    </div>
                                  </div>
                                \`;
                              }).join('')}
                            </div>
                          \`}
                        </div>
                      </div>
                    \`;
                  }).join('')}
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      \` : \`
        <!-- Tab Content: Lecture Delivery History Log -->
        <div class="card" style="padding:20px; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <h4 style="margin:0; font-size:15px; font-weight:800; color:var(--dark-navy, #0B1F3A);">
              Delivered Lectures &amp; Topics Covered Log
            </h4>
            <span style="font-size:12px; color:var(--text-muted, #64748B);">
              Showing \${filteredLectures.length} of \${allLecturesList.length} total recorded lectures
            </span>
          </div>

          \${filteredLectures.length === 0 ? \`
            <div style="padding:30px; text-align:center; background:#F8FAFC; border-radius:8px; color:#64748B; font-size:13px;">
              No lectures found matching your filter. Click "+ Add Lecture" under any curriculum topic to record one.
            </div>
          \` : \`
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                  <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0; color:#475569; font-size:12px; text-transform:uppercase;">
                    <th style="padding:10px 12px; width:90px;">Lecture #</th>
                    <th style="padding:10px 12px; width:110px;">Date</th>
                    <th style="padding:10px 12px; width:160px;">Unit &amp; Topic</th>
                    <th style="padding:10px 12px;">Topics Covered</th>
                    <th style="padding:10px 12px; width:130px; textAlign:center;">Attendance</th>
                    <th style="padding:10px 12px; width:130px; textAlign:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  \${filteredLectures.map(lec => {
                    const isMarked = !!lec.attendanceMarked || lec.attendanceStatus === 'Marked';
                    const covered = Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0
                      ? lec.topicsCovered
                      : [lec.topicName];

                    return \`
                      <tr style="border-bottom:1px solid #F1F5F9; font-size:13px;">
                        <td style="padding:12px; font-weight:800; color:#0B1F3A;">
                          <span style="background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px;">
                            Lec \${lec.lectureNo}
                          </span>
                        </td>
                        <td style="padding:12px; color:#475569;">
                          \${lec.date}
                        </td>
                        <td style="padding:12px;">
                          <div style="font-weight:700; color:#0B1F3A;">\${lec.topicName}</div>
                          <span style="font-size:11px; color:#64748B;">\${lec.unitName ? lec.unitName.split(':')[0] : 'Unit'}</span>
                        </td>
                        <td style="padding:12px;">
                          <div style="display:flex; flex-wrap:wrap; gap:4px;">
                            \${covered.map(t => \`
                              <span style="background:#F1F5F9; color:#1E293B; border:1px solid #CBD5E1; border-radius:12px; padding:1px 7px; font-size:11px; font-weight:600;">
                                🏷️ \${t}
                              </span>
                            \`).join('')}
                          </div>
                          \${lec.notes ? \`
                            <p style="margin:4px 0 0 0; font-size:11px; color:#64748B; font-style:italic;">
                              📝 \${lec.notes}
                            </p>
                          \` : ''}
                        </td>
                        <td style="padding:12px; text-align:center;">
                          \${isMarked ? \`
                            <span style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:800;">
                              ✓ Marked
                            </span>
                          \` : \`
                            <span style="background:#FEF3C7; color:#B45309; border:1px solid #FDE047; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">
                              Not Marked
                            </span>
                          \`}
                        </td>
                        <td style="padding:12px; text-align:right;">
                          <button type="button" onclick="TeacherApp.openLectureAttendanceModal('\${lec.subjectId}', '\${lec.unitId}', '\${lec.topicId}', '\${lec.id}', '\${lec.date}', '\${lec.classId}', '\${lec.topicName.replace(/'/g, "\\\\'")}', '\${lec.subjectName.replace(/'/g, "\\\\'")}')" style="background:\${isMarked ? '#FFFFFF' : 'var(--primary-blue, #0B5CAD)'}; color:\${isMarked ? 'var(--primary-blue, #0B5CAD)' : '#FFFFFF'}; border:\${isMarked ? '1px solid var(--primary-blue, #0B5CAD)' : 'none'}; padding:5px 10px; border-radius:5px; font-size:11.5px; font-weight:700; cursor:pointer; white-space:nowrap;">
                            \${isMarked ? 'View / Edit' : 'Mark Attendance'}
                          </button>
                        </td>
                      </tr>
                    \`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          \`}
        </div>
      \`}
    \`;

    if (window.lucide) window.lucide.createIcons();
  },
`;

  code = code.substring(0, startIndex) + newRenderSyllabusView + "\n" + code.substring(endIndex);

  // Also update exportSyllabusCsv to output lecture-level CSV
  const exportCsvStart = "  exportSyllabusCsv(subjectId) {";
  const exportCsvEnd = "  downloadSyllabusReport(subjectId) {";
  const expStartIdx = code.indexOf(exportCsvStart);
  const expEndIdx = code.indexOf(exportCsvEnd);

  if (expStartIdx !== -1 && expEndIdx !== -1) {
    const newExportCsv = `  exportSyllabusCsv(subjectId) {
    const all = TeacherERPData.loadSyllabusData();
    const activeSubject = all.find(s => s.subjectId === subjectId);
    if (!activeSubject) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += \`Subject Name,\${activeSubject.subjectName}\\r\\n\`;
    csvContent += \`Class,\${activeSubject.classId}\\r\\n\`;
    csvContent += \`Faculty Name,\${activeSubject.facultyName || 'Faculty'}\\r\\n\`;
    csvContent += \`Total Planned Lectures,\${activeSubject.totalLecturesPlanned || 60}\\r\\n\`;
    csvContent += \`Total Lectures Engaged,\${activeSubject.totalLecturesTaken || 0}\\r\\n\`;
    csvContent += \`Overall Coverage,\${activeSubject.progress || 0}%\\r\\n\\r\\n\`;
    csvContent += "Lecture No,Date,Unit,Topic,Topics Covered,Attendance Status,Attendance ID,Notes\\r\\n";

    (activeSubject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        (topic.lectures || []).forEach(lec => {
          const lNo = lec.lectureNo;
          const date = lec.date || '';
          const uName = \`"\${(unit.unitName || '').replace(/"/g, '""')}"\`;
          const tName = \`"\${(topic.topicName || '').replace(/"/g, '""')}"\`;
          const covered = \`"\${(Array.isArray(lec.topicsCovered) ? lec.topicsCovered.join('; ') : (lec.topicsCovered || '')).replace(/"/g, '""')}"\`;
          const status = lec.attendanceMarked ? 'Marked' : 'Not Marked';
          const attId = lec.attendanceId || '';
          const notes = \`"\${(lec.notes || '').replace(/"/g, '""')}"\`;
          csvContent += \`\${lNo},\${date},\${uName},\${tName},\${covered},\${status},\${attId},\${notes}\\r\\n\`;
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`Syllabus_Lectures_\${activeSubject.subjectCode || 'SUB'}_\${activeSubject.classId || 'CLASS'}_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof this.showToast === 'function') {
      this.showToast(\`Syllabus report for \${activeSubject.subjectName} exported!\`, 'success');
    }
  },
`;
    code = code.substring(0, expStartIdx) + newExportCsv + "\n" + code.substring(expEndIdx);
  }

  fs.writeFileSync(targetFile, code, 'utf8');
  console.log("Successfully updated renderSyllabusView in", targetFile);
});

