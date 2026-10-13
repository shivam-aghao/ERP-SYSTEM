const fs = require('fs');
const path = require('path');
const { TeacherERPData } = require('../frontend/js/data.js');

const filesToUpdate = [
  path.join(__dirname, '../src/data/mockTeacherData.js'),
  path.join(__dirname, '../Teacher_Dashboard/frontend/src/data/mockTeacherData.js')
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.warn("File does not exist:", filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace syllabus array
  const startToken = "  syllabus: [";
  const endToken = "export function loadSyllabusData() {";

  const startIndex = code.indexOf(startToken);
  const endIndex = code.indexOf(endToken);

  if (startIndex !== -1 && endIndex !== -1) {
    const newSyllabusStr = `  syllabus: ${JSON.stringify(TeacherERPData.syllabus, null, 2)},\n};\n\n/**\n * Load active syllabus collection (with localStorage state persistence)\n */\n`;
    code = code.substring(0, startIndex) + newSyllabusStr + code.substring(endIndex);
    console.log("Replaced syllabus in", filePath);
  } else {
    console.error("Tokens not found in", filePath);
  }

  // Update loadSyllabusData version and normalization
  code = code.replace(
    /const stored = window\.localStorage\.getItem\("ssgmce_syllabus_data"\);/g,
    `const storedVer = window.localStorage.getItem("ssgmce_syllabus_ver");
      const stored = window.localStorage.getItem("ssgmce_syllabus_data");
      if (stored && storedVer === "v5") {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(s => {
            (s.units || []).forEach(u => {
              (u.topics || []).forEach(t => {
                if (!Array.isArray(t.lectures)) t.lectures = [];
                t.lectures.forEach(l => {
                  if (!Array.isArray(l.topicsCovered)) {
                    l.topicsCovered = l.topicsCovered ? [l.topicsCovered] : [t.topicName];
                  }
                  if (!l.attendanceStatus) {
                    l.attendanceStatus = l.attendanceMarked ? "Marked" : "Not Marked";
                  }
                });
                t.plannedLectures = Number(t.plannedLectures || t.noOfLectures || t.estimatedLectures || 1);
                t.engagedLectures = Array.isArray(t.lectures) ? t.lectures.length : Number(t.engagedLectures || t.lecturesTaken || 0);
                t.lecturesTaken = t.engagedLectures;
              });
            });
          });
          mockTeacherData.syllabus = parsed;
          return parsed;
        }
      }
      try {
        window.localStorage.setItem("ssgmce_syllabus_ver", "v5");
        window.localStorage.setItem("ssgmce_syllabus_data", JSON.stringify(mockTeacherData.syllabus));
      } catch (_) {}
      return mockTeacherData.syllabus;`
  );

  // Update addLectureToTopic
  const addLecRegex = /const newLecture = \{[\s\S]*?records: \[\]\s*\};/;
  const addLecReplacement = `const newLecture = {
    id: \`LEC-\${topicId}-\${nextLectureNo}-\${Date.now().toString(36)}\`,
    lectureNo: nextLectureNo,
    date: lectureData.date || today,
    timeSlot: lectureData.timeSlot || "09:00 - 10:30 AM",
    topicName: topic.topicName,
    subjectName: subject.subjectName,
    classId: subject.classId,
    topicsCovered: Array.isArray(lectureData.topicsCovered) && lectureData.topicsCovered.length > 0
      ? lectureData.topicsCovered
      : (lectureData.topicsCovered ? [String(lectureData.topicsCovered).trim()] : [topic.topicName]),
    notes: lectureData.notes || "",
    attendanceStatus: "Not Marked",
    attendanceMarked: false,
    attendanceRecordId: null,
    attendanceId: null,
    records: []
  };`;

  code = code.replace(addLecRegex, addLecReplacement);

  // Update markLectureAttendance
  code = code.replace(
    /lecture\.attendanceMarked = true;\s*lecture\.attendanceRecordId =/g,
    `lecture.attendanceMarked = true;
  lecture.attendanceStatus = "Marked";
  lecture.attendanceId = attendanceDetails.recordId || \`ATT-LEC-\${lecture.id || Date.now()}\`;
  lecture.attendanceRecordId =`
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log("Successfully wrote updated file:", filePath);
});

