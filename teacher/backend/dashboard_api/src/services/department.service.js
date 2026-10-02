import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: 'laptop', classesCount: 6, headOfDept: 'Dr. S. B. Somani' },
  { code: 'IT', name: 'Information Technology', icon: 'server', classesCount: 4, headOfDept: 'Dr. P. R. Dhabe' },
  { code: 'EE', name: 'Electrical Engineering', icon: 'zap', classesCount: 4, headOfDept: 'Dr. M. A. Beg' },
  { code: 'MECH', name: 'Mechanical Engineering', icon: 'tool', classesCount: 4, headOfDept: 'Dr. S. S. Deshmukh' },
  { code: 'ENTC', name: 'Electronics & Telecommunication', icon: 'radio', classesCount: 4, headOfDept: 'Dr. D. D. Shah' },
  { code: 'ASH', name: 'Applied Science & Humanities', icon: 'book', classesCount: 2, headOfDept: 'Dr. N. H. Khandare' },
];

export const departmentService = {
  async getAllDepartments() {
    try {
      const departments = await prisma.department.findMany({
        include: {
          _count: {
            select: { classes: true, faculty: true, students: true },
          },
        },
        orderBy: { code: 'asc' },
      });
      if (departments && departments.length > 0) return departments;
    } catch (_) {}

    return MOCK_DEPARTMENTS;
  },

  async getDepartmentByCode(code) {
    try {
      const department = await prisma.department.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          classes: true,
          faculty: true,
        },
      });
      if (department) return department;
    } catch (_) {}

    const found = MOCK_DEPARTMENTS.find((d) => d.code === code.toUpperCase());
    if (!found) throw new ApiError(404, `Department ${code} not found`);
    return found;
  },
};

export default departmentService;

