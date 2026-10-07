import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const STUDENT_NAMES = [
  'Aarav Sharma', 'Ananya Patel', 'Rohan Kulkarni', 'Priya Verma', 'Siddharth Joshi',
  'Diya Deshmukh', 'Aditya More', 'Ishaan Chavan', 'Janhavi Pawar', 'Gaurav Jadhav',
  'Manasi Kale', 'Nikhil Bhole', 'Pooja Mishra', 'Pranav Salunkhe', 'Rohit Gupta',
  'Rutuja Gaikwad', 'Sahil Khan', 'Sakshi Mane', 'Sameer Inamdar', 'Sanjana Kadam',
  'Sarang Patil', 'Shreya Thakur', 'Siddhant Rao', 'Snehal Wagh', 'Sujay Bhosale',
  'Tanvi Sawant', 'Tejas Shirodkar', 'Utkarsh Narvekar', 'Vaishnavi Naik', 'Varun Mahajan'
];

function generateClassStudents(classCode = '2R1', dept = 'CSE') {
  return STUDENT_NAMES.map((name, idx) => {
    const roll = idx + 1;
    const rollFormatted = `${classCode}-${String(roll).padStart(2, '0')}`;
    const cardId = `CARD-${classCode}-${String(roll).padStart(3, '0')}`;
    return {
      id: `b0000000-0000-0000-0000-${String(roll).padStart(12, '0')}`,
      rollNo: roll,
      rollFormatted,
      enrollmentNo: `EN24${dept}${String(roll).padStart(3, '0')}`,
      cardId,
      rfidTag: cardId,
      name,
      classCode,
      departmentCode: dept,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@ssgmce.ac.in`,
      phone: `+91 98230 ${String(10000 + roll * 111).slice(-5)}`,
      isActive: true,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };
  });
}

const MOCK_STUDENTS = generateClassStudents('2R1', 'CSE');


export const studentService = {
  async getStudentByCardId(cardId) {
    if (!cardId) return null;
    const cleaned = String(cardId).trim().toUpperCase();

    // Check in database first if available
    try {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { cardId: cleaned },
            { enrollmentNo: cleaned },
            { rollFormatted: cleaned },
          ],
        },
        include: { class: true },
      });
      if (student) return student;
    } catch (_) {}

    // Check mock students across all registered classes
    const classes = ['2R1', '2R2', '3R', '4R'];
    for (const c of classes) {
      const list = generateClassStudents(c, 'CSE');
      const found = list.find((s) => {
        const sCard = (s.cardId || '').toUpperCase();
        const sEnroll = (s.enrollmentNo || '').toUpperCase();
        const sRollFmt = (s.rollFormatted || '').toUpperCase();
        const rfidSimple = `RFID-${s.rollNo}`;
        const pinSimple = String(1000 + s.rollNo);
        return (
          sCard === cleaned ||
          sEnroll === cleaned ||
          sRollFmt === cleaned ||
          rfidSimple === cleaned ||
          pinSimple === cleaned ||
          cleaned.endsWith(`-${String(s.rollNo).padStart(2, '0')}`)
        );
      });
      if (found) return found;
    }

    return null;
  },
  async getStudents(filters = {}) {
    const { classCode, departmentCode, search, page = 1, limit = 50 } = filters;
    try {
      const where = {};
      if (classCode) where.classCode = classCode;
      if (departmentCode) where.departmentCode = departmentCode;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { enrollmentNo: { contains: search, mode: 'insensitive' } },
          { rollFormatted: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          include: { class: true },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { rollNo: 'asc' },
        }),
        prisma.student.count({ where }),
      ]);

      if (students && students.length > 0) {
        return {
          students,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        };
      }
    } catch (_) {}

    let filtered = [...MOCK_STUDENTS];
    if (classCode) {
      filtered = filtered.filter((s) => s.classCode.toLowerCase() === classCode.toLowerCase());
      if (filtered.length === 0) {
        filtered = generateClassStudents(classCode, departmentCode || 'CSE');
      }
    }
    if (departmentCode) filtered = filtered.filter((s) => s.departmentCode === departmentCode);
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.enrollmentNo.toLowerCase().includes(search.toLowerCase()) ||
          s.rollFormatted.toLowerCase().includes(search.toLowerCase())
      );
    }

    return {
      students: filtered,
      pagination: {
        page: 1,
        limit: filtered.length,
        total: filtered.length,
        pages: 1,
      },
    };
  },

  async getStudentById(id) {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          class: true,
          attendanceRecords: { take: 10, orderBy: { markedAt: 'desc' } },
          results: true,
        },
      });
      if (student) return student;
    } catch (_) {}

    const found = MOCK_STUDENTS.find((s) => s.id === id);
    if (!found) throw new ApiError(404, 'Student not found');
    return found;
  },

  async createStudent(data) {
    try {
      const rollFormatted = data.rollFormatted || `${data.classCode}-${String(data.rollNo).padStart(2, '0')}`;
      const student = await prisma.student.create({
        data: {
          ...data,
          rollFormatted,
        },
      });
      return student;
    } catch (_) {
      const rollFormatted = data.rollFormatted || `${data.classCode}-${String(data.rollNo).padStart(2, '0')}`;
      return {
        id: 'mock-student-' + Date.now(),
        ...data,
        rollFormatted,
        isActive: true,
      };
    }
  },

  async updateStudent(id, data) {
    try {
      const updated = await prisma.student.update({
        where: { id },
        data,
      });
      return updated;
    } catch (_) {
      const found = MOCK_STUDENTS.find((s) => s.id === id);
      if (!found) throw new ApiError(404, 'Student not found');
      return { ...found, ...data };
    }
  },
};

export default studentService;

