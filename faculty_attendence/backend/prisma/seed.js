import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STUDENT_NAMES = [
  "Aarav Deshmukh", "Ananya Joshi", "Atharva Patil", "Bhavesh Kulkarni", "Devendra Shinde",
  "Gaurav Gawande", "Ishaan Rathod", "Mansi Wankhade", "Omkar Jadhav", "Pratiksha Tayade",
  "Rohan Ingle", "Sakshi Thakare", "Shubham Agrawal", "Tanvi Wagh", "Vaibhav Kale",
  "Yash Chopade", "Aditi Deshpande", "Akash Solanke", "Amey Kadam", "Aniket Kharche",
  "Anushka More", "Ashwin Shelke", "Chetan Bhoyar", "Darshan Tale", "Dhanashree Nemade",
  "Divya Mahajan", "Harshada Dhote", "Hrishikesh Zope", "Jayesh Sonone", "Kalyani Warade",
  "Kaustubh Bharad", "Ketaki Dandge", "Madhura Borse", "Mayur Wagh", "Neha Pachpor",
  "Nikhil Raut", "Nisha Hiwale", "Pallavi Gawali", "Piyush Saraf", "Pranav Sarnaik",
  "Pooja Deshmukh", "Prathamesh Bobade", "Radhika Kute", "Rajat Sharma", "Rashmi Tapadiya",
  "Riddhi Mundhada", "Rucha Kulkarni", "Rushikesh Chavan", "Sahil Mundhada", "Samiksha Kolte",
  "Sanket Patil", "Sayali Junghare", "Shravani Khandare", "Siddhesh Pande", "Snehal Ghuge",
  "Sudarshan Kale", "Swapnil Tale", "Tejaswini Sawale", "Utkarsh Wankhade", "Vedant Deshmukh"
];

async function main() {
  console.log('🌱 Starting SSGMCE ERP database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceHistorySummary.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.classCard.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Seed Departments
  console.log('Creating Departments...');
  const deptData = [
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'ENTC', name: 'Electronics & Telecommunication Engineering' },
    { code: 'ASH', name: 'Applied Science & Humanities' },
  ];

  const depts = {};
  for (const d of deptData) {
    depts[d.code] = await prisma.department.create({ data: d });
  }

  // 3. Seed Users
  console.log('Creating Faculty Users...');
  const passwordHash = await bcrypt.hash('Demo@123', 12);

  const kultheUser = await prisma.user.create({
    data: {
      employeeCode: '1039226014',
      email: 'kulthe.kv@ssgmce.ac.in',
      passwordHash,
      fullName: 'Mr. K.V. Kulthe',
      role: 'TA',
      designation: 'Teaching Assistant',
      phone: '+91 98765 43210',
      avatarInitials: 'KK',
      departmentId: depts['CSE'].id,
    },
  });

  const sharmaUser = await prisma.user.create({
    data: {
      employeeCode: 'EMP-CSE-1042',
      email: 'rajesh.sharma@ssgmce.ac.in',
      passwordHash,
      fullName: 'Prof. Rajesh Sharma',
      role: 'TEACHER',
      designation: 'Associate Professor',
      phone: '+91 98220 12345',
      avatarInitials: 'RS',
      departmentId: depts['CSE'].id,
    },
  });

  const hodUser = await prisma.user.create({
    data: {
      employeeCode: 'EMP-CSE-HOD',
      email: 'hod.cse@ssgmce.ac.in',
      passwordHash,
      fullName: 'Dr. S. B. Somani',
      role: 'HOD',
      designation: 'Head of Department & Professor',
      phone: '+91 98220 99999',
      avatarInitials: 'SS',
      departmentId: depts['CSE'].id,
    },
  });

  // Assign HOD to CSE
  await prisma.department.update({
    where: { id: depts['CSE'].id },
    data: { hodUserId: hodUser.id },
  });

  // 4. Seed Classes
  console.log('Creating Classes...');
  const classes = {};

  classes['2R1'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: '2R1', year: 2, division: '1', semester: 3, strength: 60 },
  });
  classes['SY-CSE-A'] = classes['2R1'];

  classes['2R2'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: '2R2', year: 2, division: '2', semester: 3, strength: 60 },
  });
  classes['3R'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: '3R', year: 3, division: '1', semester: 5, strength: 65 },
  });
  classes['4R'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: '4R', year: 4, division: '1', semester: 7, strength: 65 },
  });

  classes['SY-CSE-A-Named'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: 'SY-CSE-A', year: 2, division: 'A', semester: 3, strength: 60 },
  });
  classes['SY-CSE-B-Named'] = await prisma.class.create({
    data: { departmentId: depts['CSE'].id, name: 'SY-CSE-B', year: 2, division: 'B', semester: 3, strength: 60 },
  });

  for (const deptCode of ['IT', 'EE', 'MECH', 'ENTC']) {
    const prefix = deptCode === 'IT' ? 'N' : deptCode === 'EE' ? 'S' : deptCode === 'MECH' ? 'M' : 'U';
    classes[`2${prefix}1`] = await prisma.class.create({
      data: { departmentId: depts[deptCode].id, name: `2${prefix}1`, year: 2, division: '1', semester: 3, strength: 60 },
    });
    classes[`3${prefix}`] = await prisma.class.create({
      data: { departmentId: depts[deptCode].id, name: `3${prefix}`, year: 3, division: '1', semester: 5, strength: 60 },
    });
  }

  // 5. Seed Subjects
  console.log('Creating Subjects...');
  const subjects = {};
  const cseSubjects = [
    { code: '3CS205MD', name: 'Database Management Systems', semester: 3, credits: 4, type: 'THEORY' },
    { code: '3CS201', name: 'Data Structures & Algorithms', semester: 3, credits: 4, type: 'THEORY' },
    { code: '3CS202', name: 'Computer Organization & Architecture', semester: 3, credits: 3, type: 'THEORY' },
    { code: '3CS203', name: 'Object Oriented Programming', semester: 3, credits: 3, type: 'THEORY' },
    { code: '3CS204', name: 'Discrete Mathematics', semester: 3, credits: 4, type: 'THEORY' },
    { code: '3CS206', name: 'Operating Systems', semester: 4, credits: 4, type: 'THEORY' },
  ];

  for (const s of cseSubjects) {
    subjects[s.code] = await prisma.subject.create({
      data: { ...s, departmentId: depts['CSE'].id },
    });
  }

  // 6. Seed 60 Students for SY-CSE-A / 2R1
  console.log('Creating 60 Students for SY-CSE-A (2R1)...');
  const createdStudents = [];
  for (let i = 1; i <= 60; i++) {
    const studentCode = `23CSE${String(i).padStart(3, '0')}`;
    const fullName = STUDENT_NAMES[i - 1] || `Student Roll ${i}`;
    const isProvisional = (i === 45);

    const student = await prisma.student.create({
      data: {
        studentCode,
        rollNo: i,
        fullName,
        classId: classes['2R1'].id,
        isProvisional,
        email: `${studentCode.toLowerCase()}@ssgmce.ac.in`,
      },
    });
    createdStudents.push(student);

    let history = 'PPPPPPPPPP';
    if (i % 7 === 0) history = 'PPAPAPPAPP';
    else if (i % 5 === 0) history = 'PPPPAPPAPA';
    else if (i % 3 === 0) history = 'PPPPPPPPPA';

    await prisma.attendanceHistorySummary.create({
      data: {
        studentId: student.id,
        classId: classes['2R1'].id,
        subjectId: subjects['3CS205MD'].id,
        last10Statuses: history,
      },
    });
  }

  // 7. Seed Class Cards
  console.log('Creating Teacher Class Cards...');
  const cardConfigs = [
    { user: kultheUser, dept: depts['CSE'], cls: classes['2R1'], subj: subjects['3CS205MD'] },
    { user: kultheUser, dept: depts['CSE'], cls: classes['2R2'], subj: subjects['3CS201'] },
    { user: kultheUser, dept: depts['CSE'], cls: classes['3R'], subj: subjects['3CS203'] },
    { user: sharmaUser, dept: depts['CSE'], cls: classes['2R1'], subj: subjects['3CS205MD'] },
    { user: sharmaUser, dept: depts['CSE'], cls: classes['2R2'], subj: subjects['3CS202'] },
  ];

  for (const c of cardConfigs) {
    await prisma.classCard.create({
      data: {
        teacherId: c.user.id,
        departmentId: c.dept.id,
        classId: c.cls.id,
        subjectId: c.subj.id,
      },
    });
  }

  // 8. Seed Recent Attendance Sessions & Records
  console.log('Creating Seed Attendance Sessions...');
  const pastDates = [
    { date: new Date('2026-09-21'), period: 1, topic: 'Entity-Relationship Data Modeling' },
    { date: new Date('2026-09-22'), period: 2, topic: 'Relational Schema & Constraints' },
    { date: new Date('2026-09-23'), period: 1, topic: 'SQL DDL and DML Queries' },
  ];

  for (const sessionInfo of pastDates) {
    const presentList = createdStudents.filter((_, idx) => (idx + sessionInfo.period) % 8 !== 0);
    const absentList = createdStudents.filter((_, idx) => (idx + sessionInfo.period) % 8 === 0);

    const session = await prisma.attendanceSession.create({
      data: {
        teacherId: kultheUser.id,
        classId: classes['2R1'].id,
        subjectId: subjects['3CS205MD'].id,
        sessionDate: sessionInfo.date,
        periodNo: sessionInfo.period,
        startTime: sessionInfo.period === 1 ? '10:15 AM' : '11:15 AM',
        endTime: sessionInfo.period === 1 ? '11:15 AM' : '12:15 PM',
        sessionType: 'REGULAR',
        topicTaught: sessionInfo.topic,
        status: 'SUBMITTED',
        totalStudents: 60,
        presentCount: presentList.length,
        absentCount: absentList.length,
        attendanceRate: parseFloat(((presentList.length / 60) * 100).toFixed(1)),
        submittedAt: new Date(sessionInfo.date.getTime() + 3600000),
      },
    });

    for (const st of presentList) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: st.id,
          status: 'PRESENT',
        },
      });
    }

    for (const st of absentList) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: st.id,
          status: 'ABSENT',
        },
      });
    }
  }

  // 9. Seed Notifications
  console.log('Creating Notifications...');
  const notifs = [
    {
      userId: kultheUser.id,
      title: 'Monthly Attendance Report Due',
      message: 'Kindly submit the verified attendance sheet for September 2026 to the HOD office by Friday.',
      type: 'WARNING',
    },
    {
      userId: kultheUser.id,
      title: 'Department Meeting',
      message: 'CSE Faculty meeting scheduled today at 4:30 PM in Seminar Hall 2.',
      type: 'INFO',
    },
    {
      userId: kultheUser.id,
      title: 'Mid-term Exam Timetable',
      message: 'Odd semester mid-term examination timetable has been published on the ERP portal.',
      type: 'SUCCESS',
    },
    {
      userId: sharmaUser.id,
      title: 'Department Meeting',
      message: 'CSE Faculty meeting scheduled today at 4:30 PM in Seminar Hall 2.',
      type: 'INFO',
    },
  ];

  for (const n of notifs) {
    await prisma.notification.create({ data: n });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
