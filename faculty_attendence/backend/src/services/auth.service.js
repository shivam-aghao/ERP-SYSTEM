import { prisma } from '../config/db.js';
import { comparePassword } from '../utils/hashing.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { cache } from '../config/redis.js';

export class AuthService {
  static async login({ employeeCode, email, password }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          employeeCode ? { employeeCode } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account has been deactivated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const payload = {
      id: user.id,
      employeeCode: user.employeeCode,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      departmentId: user.departmentId,
      departmentCode: user.department?.code,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });

    const userSafe = {
      id: user.id,
      employeeCode: user.employeeCode,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      designation: user.designation,
      phone: user.phone,
      avatarInitials: user.avatarInitials,
      department: user.department ? {
        id: user.department.id,
        code: user.department.code,
        name: user.department.name,
      } : null,
    };

    return {
      accessToken,
      refreshToken,
      user: userSafe,
    };
  }

  static async refreshToken(oldRefreshToken) {
    if (await cache.isBlacklisted(oldRefreshToken)) {
      const error = new Error('Refresh token has been revoked');
      error.statusCode = 401;
      error.code = 'TOKEN_REVOKED';
      throw error;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { department: true },
    });

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const payload = {
      id: user.id,
      employeeCode: user.employeeCode,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      departmentId: user.departmentId,
      departmentCode: user.department?.code,
    };

    const newAccessToken = signAccessToken(payload);
    return {
      accessToken: newAccessToken,
    };
  }

  static async logout(accessToken, refreshToken) {
    if (accessToken) {
      await cache.blacklistToken(accessToken, 900);
    }
    if (refreshToken) {
      await cache.blacklistToken(refreshToken, 604800);
    }
    return true;
  }
}
