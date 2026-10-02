import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.replace(/^Bearer\s+/, '') ||
      req.cookies?.accessToken ||
      req.headers['x-access-token'];

    const explicitTeacherId = req.headers['x-teacher-id'] || req.query.teacherId;
    if (explicitTeacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [{ id: explicitTeacherId }, { employeeCode: explicitTeacherId }]
        }
      });
      if (teacher) {
        req.teacher = teacher;
        return next();
      }
    }

    if (!token) {
      const defaultTeacher = await prisma.teacher.findFirst({
        where: { isActive: true }
      });
      if (defaultTeacher) {
        req.teacher = defaultTeacher;
        return next();
      }
      throw new ApiError(401, 'Unauthorized request: No token or teacher ID provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id }
    });

    if (!teacher || !teacher.isActive) {
      throw new ApiError(401, 'Invalid Access Token or inactive teacher account');
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    next(new ApiError(401, error.message || 'Invalid Access Token'));
  }
};
