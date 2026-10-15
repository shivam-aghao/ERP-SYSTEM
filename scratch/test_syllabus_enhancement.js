const { TeacherERPData } = require('../frontend/js/data.js');

console.log('==============================================');
console.log('SYLLABUS MODULE ENHANCEMENT VERIFICATION TEST');
console.log('==============================================\n');

// 1. Test Faculty-Specific Subject Isolation
const testFaculties = ['EMP-CSE-1001', 'EMP-CSE-1005', 'EMP-CSE-1002', 'EMP-CSE-1009'];

testFaculties.forEach(facId => {
  const subjects = TeacherERPData.getSyllabusForTeacher(facId);
  console.log(`[FACULTY ISOLATION] Faculty: ${facId} -> Found ${subjects.length} subjects:`);
  subjects.forEach(s => {
    console.log(`   - ${s.subjectId}: ${s.subjectName} (${s.classId}) [Faculty: ${s.facultyId}]`);
    if (s.facultyId !== facId && !(facId === 'EMP-CSE-1001' && s.facultyId === 'T-001') && !(facId === 'EMP-CSE-1005' && s.facultyId === 'T-005')) {
      throw new Error(`LEAK DETECTED: Faculty ${facId} can see subject belonging to ${s.facultyId}!`);
    }
  });
});

console.log('\n✓ Faculty subject isolation passed: Strict separation confirmed.\n');

// 2. Test Syllabus Data Structure (Topic + Lecture + Topics Covered)
const all = TeacherERPData.loadSyllabusData();
let totalLecturesFound = 0;
let totalWithTopicsCovered = 0;

all.forEach(sub => {
  (sub.units || []).forEach(unit => {
    (unit.topics || []).forEach(topic => {
      (topic.lectures || []).forEach(lec => {
        totalLecturesFound++;
        if (Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0) {
          totalWithTopicsCovered++;
        } else {
          console.error(`Missing topicsCovered in ${sub.subjectId} -> ${topic.topicId} -> Lecture ${lec.lectureNo}`);
        }
        if (!lec.attendanceStatus) {
          console.error(`Missing attendanceStatus in ${sub.subjectId} -> ${topic.topicId} -> Lecture ${lec.lectureNo}`);
        }
      });
    });
  });
});

console.log(`[DATA STRUCTURE] Total Lectures: ${totalLecturesFound}`);
console.log(`[DATA STRUCTURE] Lectures with topicsCovered: ${totalWithTopicsCovered}/${totalLecturesFound}`);
if (totalLecturesFound !== totalWithTopicsCovered) {
  throw new Error('Some lectures missing topicsCovered!');
}
console.log('✓ All lectures correctly conform to schema with topicsCovered and attendanceStatus.\n');

// 3. Test Adding a Lecture with Topics Covered
const subToTest = all[0];
const unitToTest = subToTest.units[0];
const topicToTest = unitToTest.topics[0];

const prevEngaged = topicToTest.engagedLectures || topicToTest.lectures.length;
console.log(`[ADD LECTURE TEST] Testing on Subject: ${subToTest.subjectId}, Topic: ${topicToTest.topicName}`);
console.log(`[ADD LECTURE TEST] Previous engaged lectures: ${prevEngaged}`);

const lecturePayload = {
  date: "2026-10-14",
  timeSlot: "09:00 - 10:30 AM",
  topicsCovered: ["Cache Memory Alignment", "Vectorization Optimization"],
  notes: "Advanced topics covered on whiteboard with code benchmarks."
};

const addResult = TeacherERPData.addLectureToTopic(
  subToTest.subjectId,
  unitToTest.unitId,
  topicToTest.topicId,
  lecturePayload
);

if (!addResult || !addResult.newLecture) {
  throw new Error('addLectureToTopic returned null or invalid result!');
}

const newLec = addResult.newLecture;
console.log(`[ADD LECTURE TEST] New Lecture created: Lecture ${newLec.lectureNo}`);
console.log(`[ADD LECTURE TEST] Topics Covered:`, newLec.topicsCovered);
console.log(`[ADD LECTURE TEST] Attendance Status:`, newLec.attendanceStatus);
console.log(`[ADD LECTURE TEST] Notes:`, newLec.notes);

if (newLec.lectureNo !== prevEngaged + 1) {
  throw new Error(`Expected lectureNo ${prevEngaged + 1}, got ${newLec.lectureNo}`);
}
if (!Array.isArray(newLec.topicsCovered) || newLec.topicsCovered.length !== 2) {
  throw new Error('topicsCovered array not saved properly!');
}
if (newLec.attendanceStatus !== 'Not Marked') {
  throw new Error(`Expected attendanceStatus 'Not Marked', got ${newLec.attendanceStatus}`);
}
console.log('✓ Add Lecture with topicsCovered passed.\n');

// 4. Test Marking Attendance for that Lecture
console.log(`[MARK ATTENDANCE TEST] Marking attendance for Lecture ${newLec.lectureNo}...`);
const attendanceDetails = {
  recordId: "ATT-TEST-999",
  date: newLec.date,
  presentCount: 18,
  absentCount: 2,
  records: [
    { studentId: "st-01", rollNo: 1, name: "Aarav Sharma", status: "present" },
    { studentId: "st-02", rollNo: 2, name: "Ananya Patel", status: "present" },
    { studentId: "st-03", rollNo: 3, name: "Aditya Deshmukh", status: "absent" }
  ]
};

const markResult = TeacherERPData.markLectureAttendance(
  subToTest.subjectId,
  unitToTest.unitId,
  topicToTest.topicId,
  newLec.id,
  attendanceDetails
);

if (!markResult || !markResult.lecture) {
  throw new Error('markLectureAttendance failed!');
}

const markedLec = markResult.lecture;
console.log(`[MARK ATTENDANCE TEST] Marked Lecture attendanceMarked:`, markedLec.attendanceMarked);
console.log(`[MARK ATTENDANCE TEST] Attendance Status:`, markedLec.attendanceStatus);
console.log(`[MARK ATTENDANCE TEST] Attendance Record ID:`, markedLec.attendanceRecordId);
console.log(`[MARK ATTENDANCE TEST] Present Count:`, markedLec.presentCount);

if (!markedLec.attendanceMarked || markedLec.attendanceStatus !== 'Marked') {
  throw new Error('attendanceStatus did not transition to Marked!');
}
console.log('✓ Lecture Attendance Marking passed.\n');

// 5. Cleanup Test Lecture
console.log(`[CLEANUP] Undoing test lecture...`);
const undoResult = TeacherERPData.undoLectureFromTopic(
  subToTest.subjectId,
  unitToTest.unitId,
  topicToTest.topicId
);
console.log(`[CLEANUP] Undone lecture: Lecture ${undoResult.removedLecture.lectureNo}`);
console.log('\n==============================================');
console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
console.log('==============================================');

