import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeTeacher } from '../serializers/teacher.serializer.js';

export class AuthService {
  static generateToken(teacher) {
    return jwt.sign(
      {
        id: teacher.id,
        employeeCode: teacher.employeeCode,
        email: teacher.email
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  static async login({ employeeCode, email }) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          ...(employeeCode ? [{ employeeCode }] : []),
          ...(email ? [{ email }] : [])
        ]
      },
      include: {
        department: true
      }
    });

    if (!teacher) {
      throw new ApiError(404, 'Teacher not found with provided credentials');
    }

    if (!teacher.isActive) {
      throw new ApiError(403, 'Your teacher account is deactivated. Contact Administrator.');
    }

    const token = this.generateToken(teacher);

    return {
      teacher: serializeTeacher(teacher),
      token
    };
  }

  static async getCurrentTeacher(teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { department: true }
    });

    if (!teacher) {
      throw new ApiError(404, 'Teacher not found');
    }

    return serializeTeacher(teacher);
  }
}
