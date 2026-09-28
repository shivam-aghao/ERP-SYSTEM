import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STUDENT_NAMES = [
  "Aaditya Sanjay Chaudhari", "Aakanksha Kishor Patil", "Aarav Nitin Deshmukh", "Abhishek Vilas Kale",
  "Aditi Gajanan Deshpande", "Akash Pramod Solanke", "Amey Vijay Kadam", "Ananya Rajesh Joshi",
  "Aniket Dilip Kharche", "Anushka Sunil More", "Ashwin Ramesh Shelke", "Atharva Sandip Patil",
  "Bhavesh Vinod Kulkarni", "Chetan Arun Bhoyar", "Darshan Sanjay Tale", "Devendra Ashok Shinde",
  "Dhanashree Mohan Nemade", "Divya Santosh Mahajan", "Gaurav Eknath Gawande", "Harshada Umesh Dhote",
  "Hrishikesh Manoj Zope", "Ishaan Satish Rathod", "Jayesh Pandurang Sonone", "Kalyani Dinesh Warade",
  "Kaustubh Pravin Bharad", "Ketaki Suresh Dandge", "Madhura Vinayak Borse", "Mansi Devidas Wankhade",
  "Mayur Dipak Wagh", "Neha Kishor Pachpor", "Nikhil Vijay Raut", "Nisha Madhav Hiwale",
  "Omkar Sunil Jadhav", "Pallavi Ganesh Gawali", "Piyush Rajendra Saraf", "Pooja Ramkrishna Deshmukh",
  "Pranav Sanjay Sarnaik", "Prathamesh Dilip Bobade", "Pratiksha Vijay Tayade", "Radhika Kailash Kute",
  "Rajat Vinod Sharma", "Rashmi Omprakash Tapadiya", "Riddhi Jugalkishor Mundhada", "Rohan Vilas Ingle",
  "Rucha Pramod Kulkarni", "Rushikesh Dilip Chavan", "Sahil Sunil Mundhada", "Sakshi Narendra Thakare",
  "Samiksha Satish Kolte", "Sanket Ashok Patil", "Sayali Sanjay Junghare", "Shivam Rajesh Aghao",
  "Shravani Sandip Khandare", "Shubham Santosh Agrawal", "Siddhesh Pradeep Pande", "Snehal Gopal Ghuge",
  "Sudarshan Sanjay Kale", "Swapnil Sudhakar Tale", "Tanvi Shrikant Wagh", "Tejaswini Anil Sawale",
  "Utkarsh Vasant Wankhade", "Vaibhav Prabhakar Kale", "Vedant Gajanan Deshmukh", "Yash Pradip Chopade",
  "Yogesh Suresh Gawande", "Zaid Khan Pathan", "Bhakti Rajesh Mundada", "Chaitanya Vijay Joshi", "Dhiraj Sanjay Gawali"
];

async function main() {
  console.log('?? Starting SSGMCE Faculty Attendance database seed...');

  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.teacherClassCard.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.department.deleteMany();

  console.log('Seeding Departments...');
  await prisma.department.createMany({
    data: [
      { code: 'CSE', name: 'Computer Science & Engineering', icon: 'monitor', color: '#0B5CAD', description: 'Department of Computer Science & Engineering, SSGMCE Shegaon' },
      { code: 'ETC', name: 'Electronics & Telecommunication Engineering', icon: 'cpu', color: '#10B981', description: 'Department of ENTC, SSGMCE Shegaon' },
      { code: 'MECH', name: 'Mechanical Engineering', icon: 'settings', color: '#F59E0B', description: 'Department of Mechanical Engineering, SSGMCE Shegaon' }
    ]
  });

  console.log('Seeding Classes...');
  await prisma.class.createMany({
    data: [
      { departmentCode: 'CSE', code: '2R1', name: 'Second Year CSE - Section 2R1', year: 'SE', division: '1', studentCount: 69, room: 'LH-201' },
      { departmentCode: 'CSE', code: '2R2', name: 'Second Year CSE - Section 2R2', year: 'SE', division: '2', studentCount: 60, room: 'LH-202' },
      { departmentCode: 'CSE', code: '3R', name: 'Third Year CSE - Section 3R', year: 'TE', division: 'A', studentCount: 65, room: 'LH-301' },
      { departmentCode: 'CSE', code: 'SY-CSE-A', name: 'Second Year CSE Division A', year: 'SE', division: 'A', studentCount: 69, room: 'LH-201' }
    ]
  });

  console.log('Seeding Subjects...');
  await prisma.subject.createMany({
    data: [
      { departmentCode: 'CSE', code: 'CS305', name: 'Database Management', type: 'Theory', defaultTime: '08:00 AM' },
      { departmentCode: 'CSE', code: 'CS303', name: 'Java Programming', type: 'Theory + Lab', defaultTime: '09:30 AM' },
      { departmentCode: 'CSE', code: 'CS302', name: 'Data Structures', type: 'Theory + Lab', defaultTime: '10:15 AM' },
      { departmentCode: 'CSE', code: '3CS205MD', name: 'Database Management Systems (THEORY)', type: 'Theory', defaultTime: '11:00 AM' }
    ]
  });

  console.log('Seeding Faculty Teacher...');
  const teacher = await prisma.teacher.create({
    data: {
      authUserId: 'auth_rajesh_1042',
      employeeCode: 'EMP-CSE-1042',
      name: 'Prof. Rajesh Sharma',
      email: 'rajesh.sharma@ssgmce.ac.in',
      designation: 'Associate Professor',
      departmentCode: 'CSE',
      avatar: 'RS',
      unreadNotifications: 2,
      isActive: true
    }
  });

  console.log('Seeding Teacher Class Cards...');
  await prisma.teacherClassCard.createMany({
    data: [
      { teacherId: teacher.id, departmentCode: 'CSE', classCode: '3R', subjectCode: 'CS305' },
      { teacherId: teacher.id, departmentCode: 'CSE', classCode: '2R1', subjectCode: 'CS303' },
      { teacherId: teacher.id, departmentCode: 'CSE', classCode: '2R2', subjectCode: 'CS302' }
    ]
  });

  console.log('Seeding Students...');
  const studentData = STUDENT_NAMES.map((name, index) => {
    const rollNumber = index + 1;
    const rollFormatted = rollNumber < 10 ? `0${rollNumber}` : `${rollNumber}`;
    const prn = `2024CSE${1000 + rollNumber}`;
    const isProvisional = rollNumber === 45 || rollNumber === 58;

    return {
      departmentCode: 'CSE',
      classCode: '2R1',
      rollNumber,
      rollFormatted,
      prn,
      name,
      isProvisional
    };
  });

  await prisma.student.createMany({ data: studentData });

  console.log('Seeding Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        teacherId: teacher.id,
        title: 'Attendance Reminder',
        message: 'Please complete attendance submission for 2R1 Java Programming before 05:00 PM.',
        type: 'warning',
        isRead: false
      },
      {
        teacherId: teacher.id,
        title: 'Academic Council Notice',
        message: 'Mid-term continuous evaluation reports are due by Friday.',
        type: 'info',
        isRead: false
      }
    ]
  });

  console.log('? SSGMCE Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('? Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
