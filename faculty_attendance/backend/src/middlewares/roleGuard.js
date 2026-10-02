import { errorResponse } from '../utils/response.js';

export const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'FORBIDDEN',
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};
