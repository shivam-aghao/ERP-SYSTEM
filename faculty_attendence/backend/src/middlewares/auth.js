import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { cache } from '../config/redis.js';
import { prisma } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'UNAUTHORIZED', 'Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (await cache.isBlacklisted(token)) {
      return errorResponse(res, 'TOKEN_REVOKED', 'Token has been revoked. Please log in again.', 401);
    }

    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'UNAUTHORIZED', 'User not found or account is deactivated', 401);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'TOKEN_EXPIRED', 'Token has expired. Please refresh your token.', 401);
    }
    return errorResponse(res, 'INVALID_TOKEN', 'Invalid authentication token', 401);
  }
};
