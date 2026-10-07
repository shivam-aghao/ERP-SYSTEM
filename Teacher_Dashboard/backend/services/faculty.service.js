import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_FACULTY_LIST = [];

export const facultyService = {
  async getAllFaculty(filters = {}) {
    const { departmentCode, search } = filters;
    try {
      const where = {};
      if (departmentCode) where.departmentCode = departmentCode;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const faculty = await prisma.faculty.findMany({
        where,
        include: { department: true },
        orderBy: { name: 'asc' },
      });
      return faculty;
    } catch (_) {
      let filtered = [...MOCK_FACULTY_LIST];
      if (departmentCode) filtered = filtered.filter((f) => f.departmentCode === departmentCode);
      if (search) filtered = filtered.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
      return filtered;
    }
  },

  async getFacultyById(id) {
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { id },
        include: {
          department: true,
          subjects: { include: { class: true } },
        },
      });
      if (faculty) return faculty;
    } catch (_) {}

    const found = MOCK_FACULTY_LIST.find((f) => f.id === id);
    if (!found) throw new ApiError(404, 'Faculty not found');
    return found;
  },

  async getFacultyByEmployeeId(employeeId) {
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { employeeId },
        include: { department: true },
      });
      if (faculty) return faculty;
    } catch (_) {}

    const found = MOCK_FACULTY_LIST.find((f) => f.employeeId === employeeId);
    if (!found) throw new ApiError(404, 'Faculty not found with provided employee ID');
    return found;
  },

  async updateFaculty(id, data) {
    try {
      const updated = await prisma.faculty.update({
        where: { id },
        data,
      });
      return updated;
    } catch (_) {
      const found = MOCK_FACULTY_LIST.find((f) => f.id === id);
      if (!found) throw new ApiError(404, 'Faculty not found');
      return { ...found, ...data };
    }
  },
};

export default facultyService;

