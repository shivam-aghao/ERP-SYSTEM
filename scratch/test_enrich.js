const fs = require('fs');
const path = require('path');

// Test how topicsCovered can be synthesized for existing lectures
function enrichSyllabusLectures(syllabusList) {
  return syllabusList.map(subject => {
    let globalLecCount = 0;
    const units = (subject.units || []).map(unit => {
      const topics = (unit.topics || []).map(topic => {
        const desc = topic.topicDescription || topic.topicName;
        // Split description by comma or semicolon
        const phrases = desc
          .split(/[,;•\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 2 && !s.toLowerCase().startsWith('such as') && !s.toLowerCase().startsWith('e.g.'));

        const lectures = (topic.lectures || []).map((lec, idx) => {
          globalLecCount++;
          const p1 = phrases[idx % phrases.length] || topic.topicName;
          const p2 = phrases[(idx + 1) % phrases.length] || "Practical Application & Analysis";
          const subtopics = Array.from(new Set([p1, p2].filter(Boolean)));
          
          return {
            ...lec,
            lectureNo: lec.lectureNo || (idx + 1),
            topicsCovered: (Array.isArray(lec.topicsCovered) && lec.topicsCovered.length > 0)
              ? lec.topicsCovered
              : subtopics,
            attendanceStatus: lec.attendanceMarked ? "Marked" : "Not Marked",
            attendanceMarked: !!lec.attendanceMarked,
            attendanceId: lec.attendanceId || (lec.attendanceMarked ? `ATT-${topic.topicId}-${lec.lectureNo || (idx + 1)}` : null),
            notes: lec.notes || (lec.attendanceMarked ? `Completed coverage of ${subtopics[0]}. Class participation high.` : "")
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
      });

      return {
        ...unit,
        topics
      };
    });

    return {
      ...subject,
      units
    };
  });
}

const dataJsPath = path.join(__dirname, '../frontend/js/data.js');
const dataContent = fs.readFileSync(dataJsPath, 'utf8');

console.log('Read data.js successfully, size:', dataContent.length);

