import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SSGMCE Database Seeding...');

  // 1. Departments
  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering', icon: 'laptop', classesCount: 6, headOfDept: 'Dr. S. B. Somani' },
    { code: 'IT', name: 'Information Technology', icon: 'server', classesCount: 4, headOfDept: 'Dr. P. R. Dhabe' },
    { code: 'EE', name: 'Electrical Engineering', icon: 'zap', classesCount: 4, headOfDept: 'Dr. M. A. Beg' },
    { code: 'MECH', name: 'Mechanical Engineering', icon: 'tool', classesCount: 4, headOfDept: 'Dr. S. S. Deshmukh' },
    { code: 'ENTC', name: 'Electronics & Telecommunication', icon: 'radio', classesCount: 4, headOfDept: 'Dr. D. D. Shah' },
    { code: 'ASH', name: 'Applied Science & Humanities', icon: 'book', classesCount: 2, headOfDept: 'Dr. N. H. Khandare' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  console.log('✅ Departments seeded');

  // 2. Faculty
  const faculty = await prisma.faculty.upsert({
    where: { employeeId: 'EMP-CSE-1001' },
    update: {
      name: 'Faculty Member',
      prefix: 'Prof.',
      title: 'Associate Professor',
      departmentCode: 'CSE',
      email: 'faculty@ssgmce.ac.in',
      phone: '+91 98765 43210',
      avatarInitials: 'FM',
      cabinLocation: 'Academic Block B, Room 204',
      officeHours: 'Mon-Thu: 3:00 PM - 5:00 PM',
      qualification: 'Ph.D. in Computer Science & Engineering',
      isActive: true,
    },
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      employeeId: 'EMP-CSE-1001',
      name: 'Faculty Member',
      prefix: 'Prof.',
      title: 'Associate Professor',
      departmentCode: 'CSE',
      email: 'faculty@ssgmce.ac.in',
      phone: '+91 98765 43210',
      avatarInitials: 'FM',
      cabinLocation: 'Academic Block B, Room 204',
      officeHours: 'Mon-Thu: 3:00 PM - 5:00 PM',
      qualification: 'Ph.D. in Computer Science & Engineering',
      isActive: true,
    },
  });
  console.log(`✅ Faculty seeded: ${faculty.name} (${faculty.employeeId})`);

  // 3. Classes
  const classes = [
    { code: '2R1', departmentCode: 'CSE', name: 'Second Year CSE - Div A', semester: 'Semester 3', studentsCount: 65, room: 'Room 201', academicYear: '2024-2025' },
    { code: '2R2', departmentCode: 'CSE', name: 'Second Year CSE - Div B', semester: 'Semester 3', studentsCount: 63, room: 'Room 202', academicYear: '2024-2025' },
    { code: '3R', departmentCode: 'CSE', name: 'Third Year CSE', semester: 'Semester 5', studentsCount: 68, room: 'Room 301', academicYear: '2024-2025' },
    { code: '4R', departmentCode: 'CSE', name: 'Final Year CSE', semester: 'Semester 7', studentsCount: 62, room: 'Room 401', academicYear: '2024-2025' },
  ];

  for (const cls of classes) {
    await prisma.class.upsert({
      where: { code: cls.code },
      update: cls,
      create: cls,
    });
  }
  console.log('✅ Classes seeded');

  // 4. Subjects
  const subjects = [
    { code: 'CS302', name: 'Data Structures & Algorithms', classCode: '2R1', facultyId: faculty.id, credits: '4 Credits', icon: 'binary', lectureTime: '10:00 AM - 11:00 AM', semester: 'Semester 3' },
    { code: 'CS501', name: 'Database Management Systems', classCode: '3R', facultyId: faculty.id, credits: '4 Credits', icon: 'database', lectureTime: '11:15 AM - 12:15 PM', semester: 'Semester 5' },
    { code: 'CS702', name: 'Information & Cyber Security', classCode: '4R', facultyId: faculty.id, credits: '3 Credits', icon: 'shield', lectureTime: '02:00 PM - 03:00 PM', semester: 'Semester 7' },
  ];

  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { code: sub.code },
      update: sub,
      create: sub,
    });
  }
  console.log('✅ Subjects seeded');

  // 5. Students
  const students = [
    { rollNo: 1, rollFormatted: '2R1-01', enrollmentNo: 'EN22104001', name: 'Aarav Sharma', classCode: '2R1', departmentCode: 'CSE', email: 'aarav.sharma@ssgmce.ac.in', phone: '+91 91234 56789' },
    { rollNo: 2, rollFormatted: '2R1-02', enrollmentNo: 'EN22104002', name: 'Ananya Patel', classCode: '2R1', departmentCode: 'CSE', email: 'ananya.patel@ssgmce.ac.in', phone: '+91 91234 56790' },
    { rollNo: 3, rollFormatted: '2R1-03', enrollmentNo: 'EN22104003', name: 'Rohan Kulkarni', classCode: '2R1', departmentCode: 'CSE', email: 'rohan.kulkarni@ssgmce.ac.in', phone: '+91 91234 56791' },
    { rollNo: 4, rollFormatted: '2R1-04', enrollmentNo: 'EN22104004', name: 'Priya Verma', classCode: '2R1', departmentCode: 'CSE', email: 'priya.verma@ssgmce.ac.in', phone: '+91 91234 56792' },
    { rollNo: 5, rollFormatted: '2R1-05', enrollmentNo: 'EN22104005', name: 'Siddharth Joshi', classCode: '2R1', departmentCode: 'CSE', email: 'siddharth.joshi@ssgmce.ac.in', phone: '+91 91234 56793' },
  ];

  for (const st of students) {
    await prisma.student.upsert({
      where: { enrollmentNo: st.enrollmentNo },
      update: st,
      create: st,
    });
  }
  console.log('✅ Students seeded');

  // 6. Timetable
  const timetableSlots = [
    { facultyId: faculty.id, dayOfWeek: 1, slotIndex: 1, subjectCode: 'CS302', classCode: '2R1', room: 'Room 201', academicYear: '2024-2025' },
    { facultyId: faculty.id, dayOfWeek: 1, slotIndex: 2, subjectCode: 'CS501', classCode: '3R', room: 'Room 301', academicYear: '2024-2025' },
    { facultyId: faculty.id, dayOfWeek: 2, slotIndex: 1, subjectCode: 'CS702', classCode: '4R', room: 'Room 401', academicYear: '2024-2025' },
    { facultyId: faculty.id, dayOfWeek: 3, slotIndex: 2, subjectCode: 'CS302', classCode: '2R1', room: 'Room 201', academicYear: '2024-2025' },
    { facultyId: faculty.id, dayOfWeek: 4, slotIndex: 1, subjectCode: 'CS501', classCode: '3R', room: 'Room 301', academicYear: '2024-2025' },
    { facultyId: faculty.id, dayOfWeek: 5, slotIndex: 3, subjectCode: 'CS702', classCode: '4R', room: 'Room 401', academicYear: '2024-2025' },
  ];

  for (const slot of timetableSlots) {
    await prisma.timetable.upsert({
      where: {
        facultyId_dayOfWeek_slotIndex_academicYear: {
          facultyId: slot.facultyId,
          dayOfWeek: slot.dayOfWeek,
          slotIndex: slot.slotIndex,
          academicYear: slot.academicYear,
        },
      },
      update: slot,
      create: slot,
    });
  }
  console.log('✅ Timetable slots seeded');

  // 7. Syllabus Progress
  const units = [
    { unitNumber: 1, unitName: 'Introduction to Data Structures & Arrays', completionPercent: 100 },
    { unitNumber: 2, unitName: 'Stacks, Queues and Recursion', completionPercent: 90 },
    { unitNumber: 3, unitName: 'Linked Lists (Singly, Doubly, Circular)', completionPercent: 75 },
    { unitNumber: 4, unitName: 'Trees, Binary Search Trees & AVL Trees', completionPercent: 40 },
    { unitNumber: 5, unitName: 'Graphs, BFS, DFS & Shortest Path', completionPercent: 10 },
    { unitNumber: 6, unitName: 'Hashing, Sorting & Searching Techniques', completionPercent: 0 },
  ];

  for (const u of units) {
    await prisma.syllabusProgress.upsert({
      where: {
        subjectCode_classCode_unitNumber: {
          subjectCode: 'CS302',
          classCode: '2R1',
          unitNumber: u.unitNumber,
        },
      },
      update: { completionPercent: u.completionPercent },
      create: {
        subjectCode: 'CS302',
        classCode: '2R1',
        facultyId: faculty.id,
        unitNumber: u.unitNumber,
        unitName: u.unitName,
        completionPercent: u.completionPercent,
      },
    });
  }
  console.log('✅ Syllabus progress seeded');

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientFacultyId: faculty.id,
        title: 'Low Attendance Alert',
        description: 'Student Roll No 2R1-05 (Siddharth Joshi) has attendance below 75% in CS302.',
        icon: 'alert-triangle',
        type: 'warning',
      },
      {
        recipientFacultyId: faculty.id,
        title: 'Mid-Sem Marks Submission',
        description: 'Deadline for submitting Mid-Semester Examination marks is October 25, 2024.',
        icon: 'calendar',
        type: 'info',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Notifications seeded');

  console.log('🎉 SSGMCE Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

