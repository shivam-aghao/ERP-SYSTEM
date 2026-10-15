const fs = require('fs');
const path = require('path');

// 1. Process data.js
const dataJsPath = path.join(__dirname, '../frontend/js/data.js');
let dataJsCode = fs.readFileSync(dataJsPath, 'utf8');

// Load TeacherERPData from data.js
const { TeacherERPData } = require('../frontend/js/data.js');

function enrichTopicLectures(topic) {
  const desc = topic.topicDescription || topic.topicName;
  const phrases = desc
    .split(/[,;•\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && !s.toLowerCase().startsWith('such as') && !s.toLowerCase().startsWith('e.g.'));

  const lectures = (topic.lectures || []).map((lec, idx) => {
    const p1 = phrases[idx % phrases.length] || topic.topicName;
    const p2 = phrases[(idx + 1) % phrases.length] || "Practical Application & Analysis";
    const subtopics = Array.from(new Set([p1, p2].filter(Boolean)));
    
    return {
      id: lec.id || `LEC-${topic.topicId}-${lec.lectureNo || (idx + 1)}`,
      lectureNo: lec.lectureNo || (idx + 1),
      date: lec.date || "2026-08-03",
      timeSlot: lec.timeSlot || "09:00 - 10:30 AM",
      topicsCovered: (Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0)
        ? lec.topicsCovered
        : subtopics,
      attendanceStatus: lec.attendanceMarked ? "Marked" : "Not Marked",
      attendanceMarked: !!lec.attendanceMarked,
      attendanceId: lec.attendanceId || (lec.attendanceMarked ? `ATT-${topic.topicId}-${lec.lectureNo || (idx + 1)}` : null),
      attendanceRecordId: lec.attendanceRecordId || lec.attendanceId || (lec.attendanceMarked ? `ATT-${topic.topicId}-${lec.lectureNo || (idx + 1)}` : null),
      notes: lec.notes || (lec.attendanceMarked ? `Completed classroom delivery of ${subtopics[0]}.` : "")
    };
  });

  const engaged = lectures.length;
  const planned = Number(topic.plannedLectures || topic.noOfLectures || topic.estimatedLectures || 1);
  let status = "Not Started";
  if (engaged >= planned) status = "Completed";
  else if (engaged > 0) status = "In Progress";

  return {
    ...topic,
    status,
    plannedLectures: planned,
    engagedLectures: engaged,
    lecturesTaken: engaged,
    lectures
  };
}

const enrichedSyllabus = TeacherERPData.syllabus.map(subject => {
  const units = (subject.units || []).map(unit => {
    const topics = (unit.topics || []).map(topic => enrichTopicLectures(topic));
    let uTaken = 0;
    let uPlanned = 0;
    topics.forEach(t => {
      uTaken += t.engagedLectures;
      uPlanned += t.plannedLectures;
    });
    return {
      ...unit,
      estimatedLectures: uPlanned,
      lecturesTaken: uTaken,
      status: uTaken >= uPlanned ? "Completed" : (uTaken > 0 ? "In Progress" : "Not Started"),
      progress: uPlanned > 0 ? Math.min(100, Math.round((uTaken / uPlanned) * 100)) : 0,
      topics
    };
  });

  let subTaken = 0;
  let subPlanned = 0;
  units.forEach(u => {
    subTaken += u.lecturesTaken;
    subPlanned += u.estimatedLectures;
  });

  return {
    ...subject,
    totalLecturesPlanned: subPlanned || subject.totalLecturesPlanned || 60,
    totalLecturesTaken: subTaken,
    progress: subPlanned > 0 ? Math.min(100, Math.round((subTaken / subPlanned) * 100)) : 0,
    completionPercentage: subPlanned > 0 ? Math.min(100, Math.round((subTaken / subPlanned) * 100)) : 0,
    units
  };
});

console.log("Enriched syllabus subjects:", enrichedSyllabus.length);

// Now update data.js: replace `syllabus: [ ... ]`
// Find `syllabus: [` in data.js
const syllabusStartToken = "  syllabus: [";
const syllabusEndToken = "  loadSyllabusData() {";

const startIndex = dataJsCode.indexOf(syllabusStartToken);
const endIndex = dataJsCode.indexOf(syllabusEndToken);

if (startIndex !== -1 && endIndex !== -1) {
  const newSyllabusStr = `  syllabus: ${JSON.stringify(enrichedSyllabus, null, 2)},\n\n`;
  dataJsCode = dataJsCode.substring(0, startIndex) + newSyllabusStr + dataJsCode.substring(endIndex);
  console.log("Replaced syllabus array in data.js");
} else {
  console.error("Could not find start/end tokens for syllabus in data.js");
}

// Also update `loadSyllabusData` in data.js to version v5 and normalize topicsCovered
dataJsCode = dataJsCode.replace(
  /ssgmce_syllabus_ver"\) === "v4"/g,
  'ssgmce_syllabus_ver") === "v5"'
);
dataJsCode = dataJsCode.replace(
  /window\.localStorage\.setItem\("ssgmce_syllabus_ver", "v4"\)/g,
  'window.localStorage.setItem("ssgmce_syllabus_ver", "v5")'
);

// Update loadSyllabusData normalization pass
const normalizerOld = `if (!Array.isArray(t.lectures)) t.lectures = [];`;
const normalizerNew = `if (!Array.isArray(t.lectures)) t.lectures = [];
                  t.lectures.forEach(l => {
                    if (!Array.isArray(l.topicsCovered)) {
                      l.topicsCovered = l.topicsCovered ? [l.topicsCovered] : [t.topicName];
                    }
                    if (!l.attendanceStatus) {
                      l.attendanceStatus = l.attendanceMarked ? "Marked" : "Not Marked";
                    }
                  });`;

dataJsCode = dataJsCode.replace(normalizerOld, normalizerNew);

// Update addLectureToTopic in data.js
const addLecOld = `    const newLecture = {
      id: "LEC-" + topicId + "-" + nextLectureNo + "-" + Date.now().toString(36),
      lectureNo: nextLectureNo,
      date: lectureData.date || today,
      timeSlot: lectureData.timeSlot || "09:00 - 10:30 AM",
      topicName: topic.topicName,
      subjectName: subject.subjectName,
      classId: subject.classId,
      attendanceMarked: false,
      attendanceRecordId: null,
      records: []
    };`;

const addLecNew = `    const newLecture = {
      id: "LEC-" + topicId + "-" + nextLectureNo + "-" + Date.now().toString(36),
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

dataJsCode = dataJsCode.replace(addLecOld, addLecNew);

// Update markLectureAttendance in data.js
const markAttOld = `    lecture.attendanceMarked = true;
    lecture.attendanceRecordId = attendanceDetails.recordId || ("ATT-LEC-" + (lecture.id || Date.now()));
    lecture.attendanceDate = attendanceDetails.date || lecture.date;
    lecture.markedAt = new Date().toISOString();
    lecture.presentCount = attendanceDetails.presentCount ?? 0;
    lecture.absentCount = attendanceDetails.absentCount ?? 0;
    lecture.records = attendanceDetails.records || [];`;

const markAttNew = `    lecture.attendanceMarked = true;
    lecture.attendanceStatus = "Marked";
    lecture.attendanceRecordId = attendanceDetails.recordId || ("ATT-LEC-" + (lecture.id || Date.now()));
    lecture.attendanceId = lecture.attendanceRecordId;
    lecture.attendanceDate = attendanceDetails.date || lecture.date;
    lecture.markedAt = new Date().toISOString();
    lecture.presentCount = attendanceDetails.presentCount ?? 0;
    lecture.absentCount = attendanceDetails.absentCount ?? 0;
    lecture.records = attendanceDetails.records || [];`;

dataJsCode = dataJsCode.replace(markAttOld, markAttNew);

fs.writeFileSync(dataJsPath, dataJsCode, 'utf8');
console.log('Successfully updated frontend/js/data.js!');

